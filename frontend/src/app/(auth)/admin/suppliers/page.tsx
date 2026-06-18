'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

interface Supplier {
  id: string;
  email: string;
  role: string;
  isVerified: boolean;
  supplierProfile?: {
    shopName: string;
    gstNumber: string;
    phone: string;
    address: string;
  };
  createdAt: string;
}

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');

  useEffect(() => {
    fetchSuppliers();
  }, [filter]);

  const fetchSuppliers = async () => {
    try {
      let q = query(collection(db, 'users'), where('role', '==', 'supplier'));
      if (filter === 'pending') {
        q = query(q, where('isVerified', '==', false));
      } else if (filter === 'approved') {
        q = query(q, where('isVerified', '==', true));
      }
      const snapshot = await getDocs(q);
      const supplierList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
      setSuppliers(supplierList);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (supplierId: string) => {
    try {
      await updateDoc(doc(db, 'users', supplierId), { isVerified: true });
      alert('Supplier approved');
      fetchSuppliers();
    } catch (error) {
      alert('Error approving supplier');
    }
  };

  const handleReject = async (supplierId: string) => {
    if (!confirm('Reject this supplier? They will be notified.')) return;
    try {
      await updateDoc(doc(db, 'users', supplierId), { isVerified: false, rejected: true });
      alert('Supplier rejected');
      fetchSuppliers();
    } catch (error) {
      alert('Error rejecting supplier');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Supplier Management</h2>
      <div className="flex gap-4 mb-6">
        <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200'}`}>Pending</button>
        <button onClick={() => setFilter('approved')} className={`px-4 py-2 rounded ${filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Approved</button>
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>All</button>
      </div>
      {suppliers.length === 0 ? (
        <p>No suppliers found.</p>
      ) : (
        <div className="space-y-4">
          {suppliers.map(supplier => (
            <div key={supplier.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold">{supplier.supplierProfile?.shopName || supplier.email}</p>
                  <p className="text-sm text-gray-500">Email: {supplier.email}</p>
                  {supplier.supplierProfile?.phone && <p className="text-sm">Phone: {supplier.supplierProfile.phone}</p>}
                  {supplier.supplierProfile?.gstNumber && <p className="text-sm">GST: {supplier.supplierProfile.gstNumber}</p>}
                  {supplier.supplierProfile?.address && <p className="text-sm">Address: {supplier.supplierProfile.address}</p>}
                  <p className="text-xs text-gray-400">Joined: {new Date(supplier.createdAt).toLocaleDateString()}</p>
                  <p className={`text-xs mt-1 ${supplier.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>Status: {supplier.isVerified ? 'Approved' : 'Pending'}</p>
                </div>
                {!supplier.isVerified && (
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(supplier.id)} className="bg-green-600 text-white px-4 py-1 rounded">Approve</button>
                    <button onClick={() => handleReject(supplier.id)} className="bg-red-600 text-white px-4 py-1 rounded">Reject</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}