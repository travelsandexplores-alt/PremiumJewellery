import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, ArrowRight, Gem } from 'lucide-react';

export default function OrderSuccess() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center px-4">
      <div className="relative">
        <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20" />
        <div className="relative bg-green-50 w-24 h-24 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
      </div>

      <div className="space-y-4 max-w-md">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Order Placed Successfully!</h1>
        <p className="text-gray-500 text-lg">Thank you for choosing PREMIUM JEWELLERY. Your order has been confirmed and we're preparing it for shipment.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-gray-200"
        >
          <ShoppingBag className="w-5 h-5" /> Continue Shopping
        </button>
        <button
          onClick={() => navigate('/admin')}
          className="flex-1 bg-white text-gray-900 border border-gray-200 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          View Orders <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <div className="pt-12 flex items-center gap-2 text-gray-400">
        <Gem className="w-5 h-5" />
        <span className="text-sm font-medium tracking-widest uppercase">Premium Experience</span>
      </div>
    </div>
  );
}
