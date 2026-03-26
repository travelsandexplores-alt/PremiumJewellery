import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, ArrowRight, Gem, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

export default function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId, buyerName, total, items } = location.state || {};

  const downloadReceipt = () => {
    if (!orderId) return;
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(180, 150, 80); // Amber-ish
    doc.text('PREMIUM JEWELLERY', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Official Order Receipt', 105, 30, { align: 'center' });
    
    // Order Info
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Order ID: #${orderId.toUpperCase()}`, 20, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 55);
    doc.text(`Customer: ${buyerName}`, 20, 60);
    
    // Table Header
    doc.line(20, 70, 190, 70);
    doc.text('Item', 20, 75);
    doc.text('Qty', 140, 75);
    doc.text('Price', 160, 75);
    doc.line(20, 78, 190, 78);
    
    // Items
    let y = 85;
    items?.forEach((item: any) => {
      doc.text(item.name, 20, y);
      doc.text(item.quantity.toString(), 140, y);
      doc.text(formatCurrency(item.price), 160, y);
      y += 10;
    });
    
    // Total
    doc.line(20, y, 190, y);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', 130, y + 10);
    doc.text(formatCurrency(total), 160, y + 10);
    
    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text('Thank you for your purchase!', 105, y + 30, { align: 'center' });
    doc.text('This is a computer generated receipt.', 105, y + 35, { align: 'center' });
    
    doc.save(`receipt-${orderId}.pdf`);
  };

  if (!orderId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold">No order found</h1>
        <button onClick={() => navigate('/')} className="text-amber-600 font-bold">Back to Home</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center px-4">
      <div className="relative">
        <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20" />
        <div className="relative bg-green-50 w-24 h-24 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
      </div>

      <div className="space-y-4 max-w-md">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Thank you, {buyerName}!</h1>
        <p className="text-gray-500 text-lg">Your order is confirmed. Please save your Order ID for tracking.</p>
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
          <div className="text-left">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Order ID</p>
            <p className="font-mono font-bold text-gray-900 break-all">{orderId}</p>
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(orderId);
              toast.success('Order ID copied to clipboard!');
            }}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
            title="Copy Order ID"
          >
            <Download className="w-5 h-5 rotate-180" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-md">
        <button
          onClick={downloadReceipt}
          className="w-full bg-amber-600 text-white py-4 rounded-2xl font-bold hover:bg-amber-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-600/20"
        >
          <Download className="w-5 h-5" /> Download Receipt (PDF)
        </button>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-gray-200"
          >
            <ShoppingBag className="w-5 h-5" /> Continue Shopping
          </button>
          <button
            onClick={() => navigate('/track')}
            className="flex-1 bg-white text-gray-900 border border-gray-200 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            Track Order <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="pt-12 flex items-center gap-2 text-gray-400">
        <Gem className="w-5 h-5" />
        <span className="text-sm font-medium tracking-widest uppercase">Premium Experience</span>
      </div>
    </div>
  );
}
