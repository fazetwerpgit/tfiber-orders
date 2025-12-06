'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronUp, Sparkles, Camera, FileText } from 'lucide-react';
import Link from 'next/link';
import OrderForm from '@/components/OrderForm';
import { OrderFormData, getPricingTier, calculatePrice, SaleType, OrderGamificationResult, SALE_TYPE_CONFIG, DEFAULT_POINTS } from '@/lib/types';
import { createOrder } from './actions';
import { SaleTypeSelector } from '@/components/gamification/SaleTypeSelector';
import { SaleSuccessModal } from '@/components/gamification/SaleSuccessModal';

export default function NewOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saleType, setSaleType] = useState<SaleType>('standard');
  const [addOnsCount, setAddOnsCount] = useState(0);
  const [showBonusPoints, setShowBonusPoints] = useState(false);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastCustomerName, setLastCustomerName] = useState('');
  const [lastGamificationResult, setLastGamificationResult] = useState<OrderGamificationResult | null>(null);

  // Calculate bonus points if user has customized sale type
  const hasBonus = saleType !== 'standard' || addOnsCount > 0;
  const bonusPoints = hasBonus
    ? SALE_TYPE_CONFIG[saleType].points - SALE_TYPE_CONFIG['standard'].points + addOnsCount * DEFAULT_POINTS.add_on
    : 0;

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
      setShowBonusPoints(false);
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
        {/* Entry Method Selector */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-xl p-4 flex items-center gap-3 shadow-md">
            <FileText className="w-6 h-6" />
            <div>
              <div className="font-semibold">Manual Entry</div>
              <div className="text-xs text-pink-200">Fill out form below</div>
            </div>
          </div>
          <Link
            href="/scan"
            className="bg-white dark:bg-gray-900 rounded-xl p-4 flex items-center gap-3 shadow-sm border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Camera className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">Scan Screenshot</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Upload image</div>
            </div>
          </Link>
        </div>

        {/* Order Form - this is the main content */}
        <OrderForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />

        {/* Sale Type & Points Section - Collapsible, at the bottom */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowBonusPoints(!showBonusPoints)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 dark:text-white">
                  Bonus Points
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {hasBonus ? (
                    <span className="text-purple-600 dark:text-purple-400 font-medium">
                      +{bonusPoints} extra points
                    </span>
                  ) : (
                    'Tap to earn extra points'
                  )}
                </div>
              </div>
            </div>
            {showBonusPoints ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showBonusPoints && (
            <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-800">
              <SaleTypeSelector
                value={saleType}
                onChange={setSaleType}
                addOnsCount={addOnsCount}
                onAddOnsChange={setAddOnsCount}
                showPoints
              />
            </div>
          )}
        </div>
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
