'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  displayOrder: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', icon: '', displayOrder: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const snapshot = await getDocs(collection(db, 'categories'));
    const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    setCategories(cats.sort((a, b) => a.displayOrder - b.displayOrder));
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newCategory.name) return;
    await addDoc(collection(db, 'categories'), {
      ...newCategory,
      slug: newCategory.slug || newCategory.name.toLowerCase().replace(/\s/g, '-'),
    });
    setNewCategory({ name: '', slug: '', icon: '', displayOrder: 0 });
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete category?')) {
      await deleteDoc(doc(db, 'categories', id));
      fetchCategories();
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Manage Categories</h2>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="font-semibold mb-3">Add New Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Name (e.g., Cement)"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Slug (e.g., cement)"
            value={newCategory.slug}
            onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="number"
            placeholder="Display order"
            value={newCategory.displayOrder}
            onChange={(e) => setNewCategory({ ...newCategory, displayOrder: parseInt(e.target.value) })}
            className="border p-2 rounded"
          />
        </div>
        <button onClick={handleAdd} className="mt-3 bg-green-700 text-white px-4 py-2 rounded">Add Category</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr><th className="p-3 text-left">Name</th><th className="p-3 text-left">Slug</th><th className="p-3 text-left">Order</th><th className="p-3">Actions</th></tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id} className="border-t">
                <td className="p-3">{cat.name}</td><td className="p-3">{cat.slug}</td><td className="p-3">{cat.displayOrder}</td>
                <td className="p-3 text-center">
                  <button onClick={() => handleDelete(cat.id)} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}