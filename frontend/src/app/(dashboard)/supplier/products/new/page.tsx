'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, storage } from '@/lib/firebase/client';
import { collection, addDoc, updateDoc, doc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const categories = ['Cement', 'Sand', 'Steel', 'Bricks', 'Granite', 'Tiles', 'Paint', 'Electrical', 'Plumbing', 'Hardware', 'Wood', 'Aggregates'];

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    price: '',
    unit: 'bag',
    minOrderQty: '1',
    location: '',
    city: '',
    state: '',
    availability: 'in_stock',
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Upload images to Firebase Storage
      const imageUrls: string[] = [];
      for (const img of images) {
        const refPath = ref(storage, `products/${user.uid}/${Date.now()}_${img.name}`);
        await uploadBytes(refPath, img);
        const url = await getDownloadURL(refPath);
        imageUrls.push(url);
      }

      // Create product document in Firestore
      const productData = {
        ...form,
        price: parseFloat(form.price),
        minOrderQty: parseInt(form.minOrderQty),
        supplierId: user.uid,
        images: imageUrls,
        createdAt: new Date().toISOString(),
        views: 0,
        inquiries: 0,
      };
      await addDoc(collection(db, 'products'), productData);

      // Increment supplier's product count
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'stats.totalProducts': increment(1),
      });

      router.push('/supplier/dashboard');
    } catch (error) {
      console.error(error);
      alert('Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder="Product title" required
          className="w-full p-2 border rounded" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
        <textarea placeholder="Description" rows={3}
          className="w-full p-2 border rounded" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        <select className="w-full p-2 border rounded" value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
          <option value="">Select Category</option>
          {categories.map(cat => <option key={cat}>{cat}</option>)}
        </select>
        <input type="text" placeholder="Subcategory (e.g., OPC 53)" className="w-full p-2 border rounded" value={form.subcategory} onChange={e => setForm({...form, subcategory: e.target.value})} />
        <div className="flex gap-4">
          <input type="number" placeholder="Price" required className="w-1/2 p-2 border rounded" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
          <select className="w-1/2 p-2 border rounded" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
            <option value="bag">Bag</option><option value="kg">kg</option><option value="ton">Ton</option>
            <option value="piece">Piece</option><option value="sqft">sq.ft.</option><option value="load">Load</option>
          </select>
        </div>
        <input type="text" placeholder="Location (e.g., Mumbai)" required className="w-full p-2 border rounded" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
        <div className="flex gap-4">
          <input type="text" placeholder="City" required className="w-1/2 p-2 border rounded" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
          <input type="text" placeholder="State" required className="w-1/2 p-2 border rounded" value={form.state} onChange={e => setForm({...form, state: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium">Product Images</label>
          <input type="file" multiple accept="image/*" onChange={handleImageChange} className="mt-1" />
          <div className="flex gap-2 mt-2">
            {imagePreviews.map((src, idx) => <img key={idx} src={src} className="w-16 h-16 object-cover rounded" />)}
          </div>
        </div>
        <button type="submit" disabled={loading} className="bg-green-700 text-white px-6 py-2 rounded-md w-full">
          {loading ? 'Uploading...' : 'Publish Product'}
        </button>
      </form>
    </div>
  );
}