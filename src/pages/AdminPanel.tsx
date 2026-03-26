import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Order, Settings } from '../types';
import { useAuth } from '../App';
import { formatCurrency, cn } from '../lib/utils';
import { Plus, Trash2, LayoutDashboard, Package, ShoppingBag, Settings as SettingsIcon, TrendingUp, Lock, Eye, EyeOff, Save, CheckCircle2, AlertCircle, Upload, X, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPanel() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminSettings, setAdminSettings] = useState<Settings | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'settings'>('dashboard');

  // Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: 'Rings'
  });

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large. Please select an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setFilePreview(dataUrl);
        setNewProduct(prev => ({ ...prev, imageUrl: '' })); // Clear URL if file is chosen
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!isAdmin) return;

    const fetchSettings = async () => {
      const settingsDoc = await getDoc(doc(db, 'settings', 'admin'));
      if (settingsDoc.exists()) {
        setAdminSettings(settingsDoc.data() as Settings);
      }
    };
    fetchSettings();

    const qProducts = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => {
      console.error("Error fetching products in admin:", error);
    });

    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders in admin:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, [isAdmin]);

  const DEFAULT_ADMIN_PASSWORD = '547354';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const effectivePassword = adminSettings?.adminPassword || DEFAULT_ADMIN_PASSWORD;
    if (password === effectivePassword) {
      setIsAuthorized(true);
      toast.success('Admin access granted');
      
      // Bootstrap settings if missing
      if (!adminSettings) {
        const settingsDoc = doc(db, 'settings', 'admin');
        setDoc(settingsDoc, {
          adminPassword: DEFAULT_ADMIN_PASSWORD,
          shopName: 'PREMIUM JEWELLERY'
        }).then(() => {
          setAdminSettings({ adminPassword: DEFAULT_ADMIN_PASSWORD, shopName: 'PREMIUM JEWELLERY' });
        }).catch(err => console.error("Failed to bootstrap settings:", err));
      }
    } else {
      toast.error('Incorrect password');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalImageUrl = filePreview || newProduct.imageUrl;
    
    if (!finalImageUrl) {
      toast.error('Please provide an image URL or upload a file');
      return;
    }

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), {
          ...newProduct,
          imageUrl: finalImageUrl,
          price: parseFloat(newProduct.price)
        });
        toast.success('Product updated successfully!');
      } else {
        await addDoc(collection(db, 'products'), {
          ...newProduct,
          imageUrl: finalImageUrl,
          price: parseFloat(newProduct.price),
          createdAt: Timestamp.now()
        });
        toast.success('Product added successfully!');
      }
      setNewProduct({ name: '', description: '', price: '', imageUrl: '', category: 'Rings' });
      setFilePreview(null);
      setEditingProduct(null);
    } catch (error) {
      console.error(error);
      toast.error(editingProduct ? 'Failed to update product' : 'Failed to add product');
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      imageUrl: product.imageUrl,
      category: product.category
    });
    setFilePreview(null);
    setActiveTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setNewProduct({ name: '', description: '', price: '', imageUrl: '', category: 'Rings' });
    setFilePreview(null);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete product');
    }
  };

  const handleUpdatePassword = async (newPass: string) => {
    try {
      await updateDoc(doc(db, 'settings', 'admin'), { adminPassword: newPass });
      setAdminSettings(prev => prev ? { ...prev, adminPassword: newPass } : null);
      toast.success('Password updated successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update password');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update order status');
    }
  };

  // Earnings Logic - Only count delivered orders
  const totalEarnings = orders
    .filter(order => order.status === 'delivered')
    .reduce((sum, order) => sum + order.totalAmount, 0);
    
  const productSales = orders
    .filter(order => order.status === 'delivered')
    .flatMap(o => o.items)
    .reduce((acc, item) => {
      acc[item.name] = (acc[item.name] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);

  const bestSellers = Object.entries(productSales)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  if (authLoading) return null;
  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4">
      <AlertCircle className="w-16 h-16 text-red-500" />
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p className="text-gray-500">You must be an admin to view this page.</p>
    </div>
  );

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl border border-gray-100 shadow-xl">
        <div className="text-center space-y-4 mb-8">
          <div className="bg-amber-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-gray-500">Enter the admin password to continue.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Admin Password"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95"
          >
            Access Panel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <aside className="w-full md:w-64 space-y-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
            activeTab === 'dashboard' ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <LayoutDashboard className="w-5 h-5" /> Dashboard
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
            activeTab === 'products' ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <Package className="w-5 h-5" /> Products
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
            activeTab === 'orders' ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <ShoppingBag className="w-5 h-5" /> Orders
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
            activeTab === 'settings' ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <SettingsIcon className="w-5 h-5" /> Settings
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Total Earnings</span>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalEarnings)}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Total Orders</span>
                  <ShoppingBag className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Total Products</span>
                  <Package className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold mb-6">Best Selling Articles</h2>
              <div className="space-y-4">
                {bestSellers.length === 0 ? (
                  <p className="text-gray-500 italic">No sales data yet.</p>
                ) : (
                  bestSellers.map(([name, count], i) => (
                    <div key={name} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 flex items-center justify-center bg-amber-100 text-amber-700 font-bold rounded-lg">{i + 1}</span>
                        <span className="font-medium text-gray-900">{name}</span>
                      </div>
                      <span className="bg-white px-3 py-1 rounded-full text-sm font-bold text-gray-600 border border-gray-200">{count} sold</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                {editingProduct ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Product Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Price (PKR)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Image URL</label>
                  <input
                    type="url"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    value={newProduct.imageUrl}
                    onChange={(e) => {
                      setNewProduct({ ...newProduct, imageUrl: e.target.value });
                      setFilePreview(null);
                    }}
                    placeholder="https://..."
                    disabled={!!filePreview}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Or Upload Image</label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 cursor-pointer transition-all">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-medium">Choose File</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                    {filePreview && (
                      <div className="relative w-12 h-12">
                        <img src={filePreview} alt="Preview" className="w-full h-full object-cover rounded-lg border" />
                        <button 
                          type="button"
                          onClick={() => setFilePreview(null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-0.5 rounded-full shadow-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Category</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  >
                    <option>Rings</option>
                    <option>Necklaces</option>
                    <option>Earrings</option>
                    <option>Bracelets</option>
                    <option>Watches</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-gray-700">Description</label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 h-24"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2 flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-all active:scale-95"
                  >
                    {editingProduct ? 'Update Product' : 'Save Product'}
                  </button>
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-8 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={product.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border" referrerPolicy="no-referrer" />
                          <span className="font-medium text-gray-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{product.category}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(product.price)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(product)}
                            className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-white p-20 text-center rounded-3xl border border-gray-100">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No orders placed yet.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</h3>
                      <p className="text-sm text-gray-500">{order.createdAt.toDate().toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as Order['status'])}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border-none focus:ring-2 focus:ring-amber-500 cursor-pointer",
                          order.status === 'delivered' ? "bg-green-100 text-green-700" : 
                          order.status === 'shipped' ? "bg-blue-100 text-blue-700" :
                          order.status === 'cancelled' ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        )}
                      >
                        <option value="pending">Pending</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <span className="text-xl font-bold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-50 pt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Shipping Info</p>
                      <p className="font-medium">{order.buyerName}</p>
                      <p className="text-sm text-gray-500">{order.buyerEmail}</p>
                      <p className="text-sm text-gray-500">{order.buyerPhone}</p>
                      <div className="mt-2 p-3 bg-gray-50 rounded-xl text-sm">
                        <p className="font-bold text-amber-700">Address:</p>
                        <p className="text-gray-600">{order.buyerAddress}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Items</p>
                      <div className="space-y-1">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span>{item.name} x {item.quantity}</span>
                            <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-xl space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Lock className="w-5 h-5" /> Security Settings
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Change Admin Password</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="New Password"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      id="new-pass-input"
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('new-pass-input') as HTMLInputElement;
                        if (input.value) handleUpdatePassword(input.value);
                      }}
                      className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-600 transition-all"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" /> Shop Configuration
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Shop Name</label>
                  <input
                    type="text"
                    defaultValue={adminSettings?.shopName}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    onChange={async (e) => {
                      await updateDoc(doc(db, 'settings', 'admin'), { shopName: e.target.value });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
