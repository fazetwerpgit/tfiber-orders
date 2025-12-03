'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import OrderForm from '@/components/OrderForm';
import { OrderFormData, getPricingTier, calculatePrice } from '@/lib/types';
import { createOrder } from './actions';

export default function NewOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true);

    try {
      const pricingTier = getPricingTier(data.has_voice_line, data.has_autopay);
      const monthlyPrice = calculatePrice(data.plan_type, data.has_voice_line, data.has_autopay);

      // Use server action to create order (bypasses RLS issues)
      const result = await createOrder({
        ...data,
        pricing_tier: pricingTier,
        monthly_price: monthlyPrice,
      });

      if (result.error) {
        console.error('Error submitting order:', result.error);
        alert(result.error);
        return;
      }

      // Success - redirect to orders list
      router.push('/orders?success=1');
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
      <main className="p-4">
        <OrderForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </main>
    </div>
  );
}
