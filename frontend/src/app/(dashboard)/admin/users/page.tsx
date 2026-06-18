'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

interface AppUser {
  id: string;
  email: string;
  role: string;
  isBlocked?: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
    setUsers(userList);
    setLoading(false);
  };

  const handleToggleBlock = async (userId: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'users', userId), { isBlocked: !currentStatus });
    fetchUsers();
    alert(`User ${!currentStatus ? 'blocked' : 'unblocked'}`);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Manage Users</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr><th className="p-3 text-left">Email</th><th className="p-3 text-left">Role</th><th className="p-3 text-left">Status</th><th className="p-3">Action</th></tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t">
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.role}</td>
                <td className="p-3">{user.isBlocked ? 'Blocked' : 'Active'}</td>
                <td className="p-3 text-center">
                  <button onClick={() => handleToggleBlock(user.id, user.isBlocked || false)} className={`px-3 py-1 rounded text-white ${user.isBlocked ? 'bg-green-600' : 'bg-red-600'}`}>
                    {user.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}