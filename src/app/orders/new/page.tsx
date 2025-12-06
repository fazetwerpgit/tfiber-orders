'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import OrderForm from '@/components/OrderForm';
import { OrderFormData, getPricingTier, calculatePrice, SaleType, OrderGamificationResult } from '@/lib/types';
import { createOrder } from './actions';
import { SaleTypeSelector } from '@/components/gamification/SaleTypeSelector';
import { SaleSuccessModal } from '@/components/gamification/SaleSuccessModal';

export default function NewOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saleType, setSaleType] = useState<SaleType>('standard');
  const [addOnsCount, setAddOnsCount] = useState(0);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastCustomerName, setLastCustomerName] = useState('');
  const [lastGamificationResult, setLastGamificationResult] = useState<OrderGamificationResult | null>(null);

  const handleSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true);

    try {
      const pricingTier = getPricingTier(data.has_voice_line, data.has_autopay);
      const monthlyPrice = calculatePrice(data.plan_type, data.has_voice_line, data.has_autopay);

      // Use server action to create order with gamification data
      const result = await createOrder({
        ...data,
        pricing_tier: pricingTier,
        monthly_price: monthlyPrice,
        sale_type: saleType,
        add_ons_count: addOnsCount,
      });

      if (result.error) {
        console.error('Error submitting order:', result.error);
        alert(result.error);
        return;
      }

      // Success - show modal with gamification results
      setLastCustomerName(data.customer_name);
      setLastGamificationResult(result.gamification || null);
      setShowSuccessModal(true);

      // Reset form state for potential next order
      setSaleType('standard');
      setAddOnsCount(0);
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnother = () => {
    // The modal will close and the form will be ready for a new entry
    // We could also reset the form here if needed
    setShowSuccessModal(false);
    // Force a page refresh to reset the OrderForm
    router.refresh();
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">New Order</h1>
        </div>
      </header>

      {/* Form */}
      <main className="p-4 space-y-4">
        {/* Sale Type & Points Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2 mb-4">
            <span className="w-1 h-6 bg-purple-600 rounded-full"></span>
            Sale Details
          </h2>
          <SaleTypeSelector
            value={saleType}
            onChange={setSaleType}
            addOnsCount={addOnsCount}
            onAddOnsChange={setAddOnsCount}
            showPoints
          />
        </div>

        {/* Order Form */}
        <OrderForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </main>

      {/* Success Modal */}
      <SaleSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        customerName={lastCustomerName}
        gamificationResult={lastGamificationResult}
        onSubmitAnother={handleSubmitAnother}
        onGoHome={handleGoHome}
      />
    </div>
  );
}
