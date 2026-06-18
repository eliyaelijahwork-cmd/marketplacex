'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface Stats {
  totalUsers: number;
  totalSuppliers: number;
  totalCustomers: number;
  totalProducts: number;
  pendingSuppliers: number;
  totalInquiries: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalSuppliers: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingSuppliers: 0,
    totalInquiries: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const suppliersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'supplier')));
      const customersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'customer')));
      const pendingSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'supplier'), where('isVerified', '==', false)));
      const productsSnap = await getDocs(collection(db, 'products'));
      const inquiriesSnap = await getDocs(collection(db, 'inquiries'));

      setStats({
        totalUsers: usersSnap.size,
        totalSuppliers: suppliersSnap.size,
        totalCustomers: customersSnap.size,
        totalProducts: productsSnap.size,
        pendingSuppliers: pendingSnap.size,
        totalInquiries: inquiriesSnap.size,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading stats...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Total Users</p>
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Suppliers</p>
          <p className="text-3xl font-bold">{stats.totalSuppliers}</p>
          <p className="text-sm text-yellow-600">{stats.pendingSuppliers} pending approval</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Customers</p>
          <p className="text-3xl font-bold">{stats.totalCustomers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Products</p>
          <p className="text-3xl font-bold">{stats.totalProducts}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Inquiries</p>
          <p className="text-3xl font-bold">{stats.totalInquiries}</p>
        </div>
      </div>
    </div>
  );
}