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
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'categories'));
      const catList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(catList);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const slug = newCategoryName.toLowerCase().replace(/\s+/g, '-');
      await addDoc(collection(db, 'categories'), {
        name: newCategoryName,
        slug,
        displayOrder: categories.length + 1,
      });
      setNewCategoryName('');
      fetchCategories();
    } catch (error) {
      alert('Error adding category');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category? All products with this category will lose categorization.')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      fetchCategories();
    } catch (error) {
      alert('Error deleting category');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Manage Categories</h2>
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="New category name"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <button onClick={addCategory} className="bg-green-600 text-white px-4 py-2 rounded">Add Category</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
            <div>
              <p className="font-semibold">{cat.name}</p>
              <p className="text-sm text-gray-500">slug: {cat.slug}</p>
            </div>
            <button onClick={() => deleteCategory(cat.id)} className="text-red-600">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}