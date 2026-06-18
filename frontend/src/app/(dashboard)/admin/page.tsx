'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSuppliers: 0,
    totalCustomers: 0,
    pendingSuppliers: 0,
    totalProducts: 0,
    totalInquiries: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const usersSnap = await getDocs(collection(db, 'users'));
    const suppliersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'supplier')));
    const customersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'customer')));
    const pendingSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'supplier'), where('isApproved', '==', false)));
    const productsSnap = await getDocs(collection(db, 'products'));
    const inquiriesSnap = await getDocs(collection(db, 'inquiries'));

    setStats({
      totalUsers: usersSnap.size,
      totalSuppliers: suppliersSnap.size,
      totalCustomers: customersSnap.size,
      pendingSuppliers: pendingSnap.size,
      totalProducts: productsSnap.size,
      totalInquiries: inquiriesSnap.size,
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Total Users</p>
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Total Suppliers</p>
          <p className="text-3xl font-bold">{stats.totalSuppliers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Total Customers</p>
          <p className="text-3xl font-bold">{stats.totalCustomers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Pending Supplier Approvals</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingSuppliers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Total Products</p>
          <p className="text-3xl font-bold">{stats.totalProducts}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Total Inquiries</p>
          <p className="text-3xl font-bold">{stats.totalInquiries}</p>
        </div>
      </div>
    </div>
  );
}