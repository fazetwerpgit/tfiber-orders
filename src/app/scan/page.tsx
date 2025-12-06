'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Image as ImageIcon, X, FileImage, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';

interface ExtractedOrderData {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  service_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  plan_type?: string;
}

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedOrderData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image is too large. Please select an image under 10MB.');
      return;
    }

    setError(null);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setExtractedData(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setExtractedData(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const processImage = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setError(null);

    // Simulate processing delay - in production this would call an AI API
    // For now, we'll show a message that manual entry is needed
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Since we don't have OCR/AI integration, show a helpful message
    setError('Automatic extraction not available yet. Please enter the order details manually or copy-paste from the screenshot.');
    setIsProcessing(false);
  };

  const handleUseData = () => {
    if (!extractedData) return;

    // Build query string from extracted data
    const params = new URLSearchParams();
    if (extractedData.customer_name) params.set('name', extractedData.customer_name);
    if (extractedData.customer_phone) params.set('phone', extractedData.customer_phone);
    if (extractedData.customer_email) params.set('email', extractedData.customer_email);
    if (extractedData.service_address) params.set('address', extractedData.service_address);
    if (extractedData.city) params.set('city', extractedData.city);
    if (extractedData.state) params.set('state', extractedData.state);
    if (extractedData.zip_code) params.set('zip', extractedData.zip_code);
    if (extractedData.plan_type) params.set('plan', extractedData.plan_type);

    router.push(`/orders/new?${params.toString()}`);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setExtractedData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Order Entry</h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Upload area */}
        {!selectedImage ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="aspect-video max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-pink-500 dark:hover:border-pink-500 transition-colors cursor-pointer flex flex-col items-center justify-center p-6"
          >
            <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-pink-600 dark:text-pink-400" />
            </div>
            <p className="text-gray-900 dark:text-white font-semibold mb-1">
              Upload Order Screenshot
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
              Tap to select or drag and drop an image
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
              PNG, JPG up to 10MB
            </p>
          </div>
        ) : (
          <div className="relative max-w-md mx-auto">
            <img
              src={selectedImage}
              alt="Order screenshot"
              className="w-full rounded-2xl shadow-lg"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Action buttons */}
        {selectedImage && !extractedData && (
          <div className="max-w-md mx-auto space-y-3">
            <button
              onClick={processImage}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 transition-opacity"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Extract Order Info
                </>
              )}
            </button>

            <Link
              href="/orders/new"
              className="block w-full text-center px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Enter Manually Instead
            </Link>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="max-w-md mx-auto bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 dark:text-amber-200 font-medium">{error}</p>
              <Link
                href="/orders/new"
                className="inline-block mt-2 text-sm text-pink-600 dark:text-pink-400 font-medium hover:text-pink-700 dark:hover:text-pink-300"
              >
                Go to order form →
              </Link>
            </div>
          </div>
        )}

        {/* Extracted data display */}
        {extractedData && (
          <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl p-4 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Data Extracted!</span>
            </div>

            <div className="space-y-2">
              {extractedData.customer_name && (
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Name</span>
                  <span className="text-gray-900 dark:text-white font-medium">{extractedData.customer_name}</span>
                </div>
              )}
              {extractedData.customer_phone && (
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Phone</span>
                  <span className="text-gray-900 dark:text-white font-medium">{extractedData.customer_phone}</span>
                </div>
              )}
              {extractedData.customer_email && (
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Email</span>
                  <span className="text-gray-900 dark:text-white font-medium">{extractedData.customer_email}</span>
                </div>
              )}
              {extractedData.service_address && (
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Address</span>
                  <span className="text-gray-900 dark:text-white font-medium">{extractedData.service_address}</span>
                </div>
              )}
              {extractedData.city && (
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">City</span>
                  <span className="text-gray-900 dark:text-white font-medium">{extractedData.city}</span>
                </div>
              )}
              {extractedData.plan_type && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-500 dark:text-gray-400">Plan</span>
                  <span className="text-gray-900 dark:text-white font-medium">{extractedData.plan_type}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={clearImage}
                className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Upload New
              </button>
              <button
                onClick={handleUseData}
                className="flex-1 px-4 py-3 bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-700 transition-colors"
              >
                Use This Data
              </button>
            </div>
          </div>
        )}

        {/* Tips section */}
        <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <FileImage className="w-5 h-5 text-pink-600" />
            Tips for Best Results
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-pink-500 mt-1">•</span>
              <span>Take clear, well-lit screenshots of order confirmations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-500 mt-1">•</span>
              <span>Include customer name, phone, and address in the screenshot</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-500 mt-1">•</span>
              <span>Crop out unnecessary parts for faster processing</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
