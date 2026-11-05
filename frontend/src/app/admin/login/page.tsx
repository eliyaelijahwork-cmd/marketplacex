
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

const ADMIN_EMAIL = 'eliyaelijahwork@gmail.com';

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      const result = await signInWithPopup(auth, provider);

      if (result.user.email?.toLowerCase() !== ADMIN_EMAIL) {
        await auth.signOut();
        setError('Access denied. This Gmail is not authorised.');
        return;
      }

      router.replace('/admin');
    } catch (err) {
      setError('Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-3">
          MarketPlaceX Admin
        </h1>

        <p className="text-gray-600 mb-6">
          Sign in with your authorised administrator Gmail.
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg"
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        {error && (
          <p className="text-red-600 mt-4">{error}</p>
        )}
      </div>
    </main>
  );
}

