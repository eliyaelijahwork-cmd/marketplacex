'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db, storage } from '@/lib/firebase/client';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import Image from 'next/image';

interface Product {
  id: string;
  title: string;
  price: number;
  unit: string;
  imageUrl: string;
  category: string;
  availability: string;
  createdAt: string;
}

export default function SupplierDashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '',
    price: '',
    unit: 'bag',
    category: 'Cement',
    description: '',
    availability: 'in_stock',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({ totalProducts: 0, totalInquiries: 0, profileViews: 0 });

  useEffect(() => {
    if (!loading && (!user || role !== 'supplier')) {
      router.push('/login');
    }
    if (user && role === 'supplier') {
      fetchProducts();
      fetchStats();
    }
  }, [user, role, loading]);

  const fetchProducts = async () => {
    const q = query(collection(db, 'products'), where('supplierId', '==', user?.uid));
    const querySnapshot = await getDocs(q);
    const productList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];
    setProducts(productList);
    setStats(prev => ({ ...prev, totalProducts: productList.length }));
  };

  const fetchStats = async () => {
    // Fetch inquiries count and profile views from Firestore
    // Placeholder for now
    setStats(prev => ({ ...prev, totalInquiries: 5, profileViews: 120 }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleAddProduct = async () => {
    if (!user) return;
    if (!newProduct.title || !newProduct.price) {
      alert('Please fill title and price');
      return;
    }
    setUploading(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
      const productData = {
        title: newProduct.title,
        price: parseFloat(newProduct.price),
        unit: newProduct.unit,
        category: newProduct.category,
        description: newProduct.description,
        availability: newProduct.availability,
        imageUrl,
        supplierId: user.uid,
        createdAt: new Date().toISOString(),
        views: 0,
        inquiries: 0,
      };
      const docRef = await addDoc(collection(db, 'products'), productData);
      setProducts([...products, { id: docRef.id, ...productData }]);
      setShowAddForm(false);
      setNewProduct({ title: '', price: '', unit: 'bag', category: 'Cement', description: '', availability: 'in_stock' });
      setImageFile(null);
      fetchProducts(); // refresh stats
    } catch (error) {
      console.error(error);
      alert('Error adding product');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProduct = async (productId: string, imageUrl: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      // Delete image from storage
      if (imageUrl) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      }
      await deleteDoc(doc(db, 'products', productId));
      setProducts(products.filter(p => p.id !== productId));
      fetchProducts();
    } catch (error) {
      alert('Error deleting product');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-green-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Supplier Dashboard</h1>
          <button onClick={() => setShowAddForm(true)} className="bg-yellow-500 text-black px-4 py-2 rounded-md">
            + Add Product
          </button>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-500">Total Products</p>
            <p className="text-2xl font-bold">{stats.totalProducts}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-500">Total Inquiries</p>
            <p className="text-2xl font-bold">{stats.totalInquiries}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-500">Profile Views</p>
            <p className="text-2xl font-bold">{stats.profileViews}</p>
          </div>
        </div>

        {/* Products List */}
        <h2 className="text-xl font-bold mb-4">Your Products</h2>
        {products.length === 0 ? (
          <p className="text-gray-500">No products yet. Click "Add Product" to get started.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
                {product.imageUrl && (
                  <Image src={product.imageUrl} alt={product.title} width={400} height={200} className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  <h3 className="font-bold text-lg">{product.title}</h3>
                  <p className="text-green-700 font-bold">₹{product.price} / {product.unit}</p>
                  <p className="text-sm text-gray-500">Category: {product.category}</p>
                  <div className="mt-2 flex justify-between">
                    <button className="text-blue-600">Edit</button>
                    <button onClick={() => handleDeleteProduct(product.id, product.imageUrl)} className="text-red-600">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Product</h2>
            <input
              type="text"
              placeholder="Product title"
              value={newProduct.title}
              onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
              className="w-full p-2 border rounded-md mb-3"
            />
            <input
              type="number"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              className="w-full p-2 border rounded-md mb-3"
            />
            <select
              value={newProduct.unit}
              onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
              className="w-full p-2 border rounded-md mb-3"
            >
              <option value="bag">Bag</option>
              <option value="ton">Ton</option>
              <option value="kg">Kg</option>
              <option value="piece">Piece</option>
              <option value="sqft">Sq.Ft.</option>
              <option value="load">Load</option>
            </select>
            <select
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              className="w-full p-2 border rounded-md mb-3"
            >
              <option>Cement</option><option>Sand</option><option>Steel</option><option>Bricks</option>
              <option>Tiles</option><option>Granite</option><option>Paint</option><option>Electrical</option>
              <option>Plumbing</option><option>Hardware</option><option>Wood</option><option>Aggregates</option>
            </select>
            <textarea
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              className="w-full p-2 border rounded-md mb-3"
              rows={3}
            />
            <select
              value={newProduct.availability}
              onChange={(e) => setNewProduct({ ...newProduct, availability: e.target.value })}
              className="w-full p-2 border rounded-md mb-3"
            >
              <option value="in_stock">In Stock</option>
              <option value="limited">Limited Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
            <input type="file" accept="image/*" onChange={handleImageChange} className="mb-3" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 border rounded-md">Cancel</button>
              <button onClick={handleAddProduct} disabled={uploading} className="px-4 py-2 bg-green-700 text-white rounded-md">
                {uploading ? 'Uploading...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}