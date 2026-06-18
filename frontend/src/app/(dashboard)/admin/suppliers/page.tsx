'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

interface Supplier {
  id: string;
  email: string;
  role: string;
  isApproved?: boolean;
  supplierProfile?: {
    shopName: string;
    gstNumber: string;
    phone: string;
    address: string;
  };
  createdAt: string;
}

export default function AdminSuppliersPage() {
  const [pendingSuppliers, setPendingSuppliers] = useState<Supplier[]>([]);
  const [approvedSuppliers, setApprovedSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const q = query(collection(db, 'users'), where('role', '==', 'supplier'));
    const snapshot = await getDocs(q);
    const suppliers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
    setPendingSuppliers(suppliers.filter(s => !s.isApproved));
    setApprovedSuppliers(suppliers.filter(s => s.isApproved));
    setLoading(false);
  };

  const handleApprove = async (supplierId: string) => {
    await updateDoc(doc(db, 'users', supplierId), { isApproved: true });
    fetchSuppliers();
    alert('Supplier approved');
  };

  const handleReject = async (supplierId: string) => {
    // Optionally delete or mark as rejected
    await updateDoc(doc(db, 'users', supplierId), { isApproved: false, isRejected: true });
    fetchSuppliers();
    alert('Supplier rejected');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Supplier Approvals</h2>

      <h3 className="text-xl font-semibold mb-4 text-yellow-600">Pending ({pendingSuppliers.length})</h3>
      {pendingSuppliers.length === 0 ? (
        <p className="text-gray-500">No pending approvals</p>
      ) : (
        <div className="space-y-4 mb-8">
          {pendingSuppliers.map(supplier => (
            <div key={supplier.id} className="bg-white p-4 rounded-lg shadow">
              <p><strong>Shop Name:</strong> {supplier.supplierProfile?.shopName || 'Not provided'}</p>
              <p><strong>Email:</strong> {supplier.email}</p>
              <p><strong>GST:</strong> {supplier.supplierProfile?.gstNumber || 'Not provided'}</p>
              <p><strong>Phone:</strong> {supplier.supplierProfile?.phone || 'Not provided'}</p>
              <p><strong>Address:</strong> {supplier.supplierProfile?.address || 'Not provided'}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => handleApprove(supplier.id)} className="bg-green-600 text-white px-4 py-1 rounded">Approve</button>
                <button onClick={() => handleReject(supplier.id)} className="bg-red-600 text-white px-4 py-1 rounded">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="text-xl font-semibold mb-4 text-green-600">Approved Suppliers ({approvedSuppliers.length})</h3>
      {approvedSuppliers.length > 0 ? (
        <div className="space-y-4">
          {approvedSuppliers.map(supplier => (
            <div key={supplier.id} className="bg-white p-4 rounded-lg shadow">
              <p><strong>{supplier.supplierProfile?.shopName || 'Supplier'}</strong> – {supplier.email}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No approved suppliers yet</p>
      )}
    </div>
  );
}