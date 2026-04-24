import React, { useState } from 'react';
import { Search, Package, Truck, CheckCircle2, XCircle, Clock, ArrowRight, AlertCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Order } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from '../components/Logo';

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = orderId.trim();
    if (!cleanId) return;

    if (!auth.currentUser) {
      setError('Please sign in to track your order. For security, only the order owner can view status.');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const docRef = doc(db, 'orders', cleanId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Order;
        // Check if the current user is the owner
        if (data.buyerId !== auth.currentUser.uid) {
          setError('Access denied. You can only track orders placed with your account.');
          return;
        }
        setOrder({ id: docSnap.id, ...data } as Order);
      } else {
        setError('Order not found. Please ensure you are using the FULL Order ID (e.g. 20+ characters) and not just the short reference.');
      }
    } catch (err: any) {
      console.error('Error tracking order:', err);
      if (err.message?.includes('permission-denied')) {
        setError('Access denied. You can only track orders placed with your account.');
      } else {
        setError('An error occurred while fetching your order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 1;
      case 'shipped': return 2;
      case 'delivered': return 3;
      case 'cancelled': return -1;
      default: return 1;
    }
  };

  const steps = [
    { id: 1, label: 'Pending', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 2, label: 'Shipped', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 3, label: 'Delivered', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
  ];

  const currentStep = order ? getStatusStep(order.status) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-12 py-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 border-4 border-white shadow-xl mb-4">
          <Package className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Track Your Order</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Enter your Order ID to see the real-time status of your premium jewellery purchase.
        </p>
      </div>

      <form onSubmit={handleTrack} className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
        <div className="relative flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-3xl shadow-xl border border-gray-100">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter Order ID (e.g. abc123xyz)"
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 transition-all font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Searching...' : 'Track Order'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </form>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-100 p-6 rounded-3xl flex items-center gap-4 text-red-700"
          >
            <XCircle className="w-6 h-6 shrink-0" />
            <p className="font-medium">{error}</p>
          </motion.div>
        )}

        {order && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            {/* Status Stepper */}
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 space-y-10">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order Status</p>
                  <h2 className="text-2xl font-bold text-gray-900 capitalize">{order.status}</h2>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Order ID</p>
                  <p className="font-mono text-[10px] text-gray-400 break-all max-w-[150px]">{order.id}</p>
                </div>
              </div>

              {order.status === 'cancelled' ? (
                <div className="bg-red-50 p-6 rounded-2xl flex items-center gap-4 text-red-700 border border-red-100">
                  <XCircle className="w-8 h-8" />
                  <div>
                    <p className="font-bold">Order Cancelled</p>
                    <p className="text-sm opacity-80">This order has been cancelled. Please contact support for more information.</p>
                  </div>
                </div>
              ) : (
                <div className="relative pt-4">
                  {/* Progress Line */}
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                      className="h-full bg-amber-500"
                    />
                  </div>

                  {/* Steps */}
                  <div className="relative flex justify-between">
                    {steps.map((step) => {
                      const Icon = step.icon;
                      const isActive = currentStep >= step.id;
                      const isCurrent = currentStep === step.id;

                      return (
                        <div key={step.id} className="flex flex-col items-center gap-3">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-lg transition-all duration-500 z-10",
                            isActive ? "bg-amber-500 text-white scale-110" : "bg-gray-100 text-gray-400"
                          )}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className={cn(
                            "text-xs font-bold uppercase tracking-wider transition-colors duration-500",
                            isActive ? "text-gray-900" : "text-gray-400"
                          )}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 space-y-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-600" /> Order Summary
                </h3>
                <div className="space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-xs font-bold text-gray-400">
                          {item.quantity}x
                        </div>
                        <span className="font-medium text-gray-700">{item.name}</span>
                      </div>
                      <span className="font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-xs">Total Amount</span>
                    <span className="text-2xl font-bold text-amber-600">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 space-y-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-600" /> Shipping Details
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</p>
                    <p className="font-bold text-gray-900">{order.buyerName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</p>
                    <p className="text-gray-600">{order.buyerPhone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Address</p>
                    <p className="text-gray-600 leading-relaxed">{order.buyerAddress}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-12 flex flex-col items-center gap-4 text-gray-400 opacity-50">
        <div className="flex items-center gap-2">
          <Logo className="w-6 h-6" />
          <span className="text-sm font-medium tracking-widest uppercase">Premium Experience</span>
        </div>
        <p className="text-xs text-center max-w-xs">
          If you have any questions about your order, please contact our support team with your Order ID.
        </p>
      </div>
    </div>
  );
}
