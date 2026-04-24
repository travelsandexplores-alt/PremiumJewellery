/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { auth, db, googleProvider, signInWithPopup, signOut } from './firebase';
import { UserProfile, Product, Order, Settings } from './types';
import { Toaster, toast } from 'sonner';
import { ShoppingCart, User as UserIcon, Settings as SettingsIcon, LogOut, Menu, X } from 'lucide-react';
import { cn, formatCurrency } from './lib/utils';
import { Logo } from './components/Logo';

// Components
import Home from './pages/Home';
import AdminPanel from './pages/AdminPanel';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import TrackOrder from './pages/TrackOrder';

// Context
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: user.uid,
              name: user.displayName || 'Anonymous',
              email: user.email || '',
              photoURL: user.photoURL || undefined,
              role: user.email === 'travelsandexplores@gmail.com' ? 'admin' : 'user',
            };
            await setDoc(doc(db, 'users', user.uid), newProfile);
            setProfile(newProfile);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Auth state error:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Signed in successfully!');
    } catch (error: any) {
      console.error('Sign-in error:', error);
      if (error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        toast.error(`Domain "${domain}" is not authorized in Firebase Console. Please add it to Authentication > Settings > Authorized domains.`, {
          duration: 10000,
        });
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Sign-in popup was blocked by your browser. Please allow popups for this site.');
      } else {
        toast.error(`Failed to sign in: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to sign out');
    }
  };

  const isAdmin = profile?.role === 'admin' || user?.email === 'travelsandexplores@gmail.com';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Cart Context
interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} added to cart!`);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};

// Layout
const Navbar = () => {
  const { user, isAdmin, signIn, logOut } = useAuth();
  const { cart } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Logo className="w-10 h-10" />
            <span className="text-xl font-bold tracking-tight text-gray-900">PREMIUM JEWELLERY</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-amber-600 font-medium">Shop</Link>
            <Link to="/track" className="text-gray-600 hover:text-amber-600 font-medium">Track Order</Link>
            {isAdmin && (
              <Link to="/admin" className="text-gray-600 hover:text-amber-600 font-medium flex items-center gap-1">
                <SettingsIcon className="w-4 h-4" /> Admin
              </Link>
            )}
            <Link to="/checkout" className="relative group">
              <ShoppingCart className="w-6 h-6 text-gray-600 group-hover:text-amber-600" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {cart.length}
                </span>
              )}
            </Link>
            {user ? (
              <div className="flex items-center space-x-4">
                <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border" />
                <button onClick={logOut} className="text-gray-600 hover:text-red-600">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={signIn}
                className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center space-x-4">
            <Link to="/checkout" className="relative">
              <ShoppingCart className="w-6 h-6 text-gray-600" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {cart.length}
                </span>
              )}
            </Link>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 py-4 space-y-4">
          <Link to="/" className="block text-gray-600 font-medium" onClick={() => setIsMenuOpen(false)}>Shop</Link>
          <Link to="/track" className="block text-gray-600 font-medium" onClick={() => setIsMenuOpen(false)}>Track Order</Link>
          {isAdmin && (
            <Link to="/admin" className="block text-gray-600 font-medium" onClick={() => setIsMenuOpen(false)}>Admin Panel</Link>
          )}
          {user ? (
            <button onClick={() => { logOut(); setIsMenuOpen(false); }} className="block text-red-600 font-medium">Sign Out</button>
          ) : (
            <button onClick={() => { signIn(); setIsMenuOpen(false); }} className="block text-amber-600 font-medium">Sign In</button>
          )}
        </div>
      )}
    </nav>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-[#FAFAFA] font-sans text-gray-900">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-success" element={<OrderSuccess />} />
                <Route path="/track" element={<TrackOrder />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
            <Toaster position="bottom-right" />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

