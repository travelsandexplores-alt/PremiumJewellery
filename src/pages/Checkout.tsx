import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth, useCart } from '../App';
import { formatCurrency, cn } from '../lib/utils';
import { CreditCard, Smartphone, ShieldCheck, ArrowRight, Trash2, ShoppingBag, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Checkout() {
  const { user, signIn } = useAuth();
  const { cart, removeFromCart, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState<'cart' | 'payment'>('cart');
  const [loading, setLoading] = useState(false);

  const [shippingData, setShippingData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    address: ''
  });
  const [processing, setProcessing] = useState(false);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to place an order');
      signIn();
      return;
    }

    if (!shippingData.phone || !shippingData.address) {
      toast.error('Please fill in all shipping details');
      return;
    }

    setProcessing(true);
    
    // Simulate processing for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const orderData = {
        buyerId: user.uid,
        buyerName: shippingData.name,
        buyerEmail: shippingData.email,
        buyerPhone: shippingData.phone,
        buyerAddress: shippingData.address,
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: total,
        paymentMethod: 'COD',
        status: 'pending',
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      clearCart();
      navigate('/order-success', { state: { orderId: docRef.id, buyerName: shippingData.name, total, items: orderData.items } });
    } catch (error) {
      console.error(error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-amber-100 border-t-amber-600 rounded-full animate-spin" />
          <ShoppingBag className="absolute inset-0 m-auto w-10 h-10 text-amber-600" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Processing Your Order</h2>
          <p className="text-gray-500">Please wait while we secure your premium items...</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-6">
        <div className="bg-gray-100 p-8 rounded-full">
          <ShoppingBag className="w-16 h-16 text-gray-400" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <p className="text-gray-500">Looks like you haven't added anything yet.</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-600 transition-all active:scale-95"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Left Column: Cart or Payment */}
      <div className="space-y-8">
        {step === 'cart' ? (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <img src={item.imageUrl} alt={item.name} className="w-24 h-24 rounded-xl object-cover border" referrerPolicy="no-referrer" />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-600">{formatCurrency(item.price)} x {item.quantity}</span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep('payment')}
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-gray-200"
            >
              Proceed to Payment <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setStep('cart')} className="text-gray-500 hover:text-gray-900 font-medium">← Back to Cart</button>
              <h1 className="text-3xl font-bold tracking-tight">Shipping Details</h1>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
              <form onSubmit={handlePlaceOrder} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      value={shippingData.name}
                      onChange={(e) => setShippingData({ ...shippingData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="03XX XXXXXXX"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      value={shippingData.phone}
                      onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    value={shippingData.email}
                    onChange={(e) => setShippingData({ ...shippingData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Shipping Address</label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 h-24"
                    value={shippingData.address}
                    onChange={(e) => setShippingData({ ...shippingData, address: e.target.value })}
                    required
                  />
                </div>

                <div className="pt-6 border-t border-gray-50">
                  <h3 className="text-sm font-bold text-gray-700 mb-4">Payment Method</h3>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-amber-600 p-2 rounded-lg">
                        <Smartphone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-amber-900">Cash on Delivery (COD)</h3>
                        <p className="text-sm text-amber-700">Pay when you receive your order.</p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full border-4 border-amber-600 bg-white" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-amber-600 transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2",
                    loading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Confirm Order <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Summary */}
      <div className="lg:sticky lg:top-24 h-fit space-y-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-xl font-bold">Order Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className="text-green-600 font-medium">FREE</span>
            </div>
            <div className="border-t border-gray-50 pt-4 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-amber-600">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-green-500" /> Secure Checkout
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your transaction is protected with industry-standard encryption. We never store your full payment details.
            </p>
          </div>
        </div>

        {!user && (
          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-bold text-amber-900">Sign in required</p>
              <p className="text-xs text-amber-700">You need to be signed in to complete your purchase and track your order.</p>
              <button
                onClick={signIn}
                className="text-sm font-bold text-amber-600 hover:text-amber-700 underline underline-offset-4"
              >
                Sign in with Google
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
