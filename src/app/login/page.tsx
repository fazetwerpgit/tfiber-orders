'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { TFiberLogo } from '@/components/branding/t-fiber-logo';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred during sign in');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-600 via-pink-700 to-pink-800 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <TFiberLogo variant="icon" size="xl" theme="dark" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Sales Portal</h1>
          <p className="text-pink-200 font-medium">T-Mobile Home Internet</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-6">
            Sign in to continue
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-4 border-2 border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span className="font-semibold text-gray-700 text-lg">
              {loading ? 'Signing in...' : 'Continue with Google'}
            </span>
          </button>

          <p className="mt-6 text-xs text-gray-400 text-center leading-relaxed">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-pink-200/80 text-sm font-medium">
          Contact your manager if you need access
        </p>
      </div>
    </div>
  );
}
