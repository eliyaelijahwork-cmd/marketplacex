import { auth } from '@/lib/firebase/client';'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      router.push('/login');
    }
  }, [user, role, loading]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user || role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gray-900 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <div className="flex gap-4">
            <Link href="/admin" className="hover:text-gray-300">Dashboard</Link>
            <Link href="/admin/suppliers" className="hover:text-gray-300">Suppliers</Link>
            <Link href="/admin/users" className="hover:text-gray-300">Users</Link>
            <Link href="/admin/categories" className="hover:text-gray-300">Categories</Link>
            <Link href="/admin/products" className="hover:text-gray-300">Products</Link>
            <button onClick={() => auth.signOut()} className="text-red-400 hover:text-red-300">Logout</button>
          </div>
        </div>
      </div>
      <div className="container mx-auto p-6">
        {children}
      </div>
    </div>
  );
}