 
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, storage } from '@/lib/firebase/client';

import {
  collection,
  setDoc,
  updateDoc,
  doc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

const categories = [
  'Cement',
  'Sand',
  'Steel',
  'Bricks',
  'Granite',
  'Tiles',
  'Paint',
  'Electrical',
  'Plumbing',
  'Hardware',
  'Wood',
  'Aggregates',
];

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

  // Select product images
  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);

    const validFiles = files.filter((file) => {
      const validType = [
        'image/jpeg',
        'image/png',
        'image/webp',
      ].includes(file.type);

      const validSize = file.size <= 5 * 1024 * 1024;

      return validType && validSize;
    });

    if (validFiles.length !== files.length) {
      alert('Only JPG, PNG and WEBP images up to 5 MB are allowed.');
    }

    if (images.length + validFiles.length > 5) {
      alert('You can upload a maximum of 5 images.');
      e.target.value = '';
      return;
    }

    setImages((prev) => [...prev, ...validFiles]);

    const previews = validFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setImagePreviews((prev) => [...prev, ...previews]);

    e.target.value = '';
  };

  // Remove selected image
  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);

    setImages((prev) =>
      prev.filter((_, i) => i !== index)
    );

    setImagePreviews((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  // Publish product
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      alert('Please login first.');
      return;
    }

    if (!images.length) {
      alert('Please select at least one product image.');
      return;
    }

    if (
      !form.title.trim() ||
      !form.category ||
      !form.price ||
      Number(form.price) <= 0 ||
      Number(form.minOrderQty) < 1
    ) {
      alert('Please enter valid product details.');
      return;
    }

    setLoading(true);

    const uploadedImagePaths: string[] = [];

    try {
      // 1. Create product document ID
      const productRef = doc(collection(db, 'products'));

      const imageUrls: string[] = [];
      const imagePaths: string[] = [];

      // 2. Upload images to Firebase Storage
      for (const [index, img] of images.entries()) {
        const filePath =
          `materials/${user.uid}/${productRef.id}/${Date.now()}_${index}_${img.name}`;

        const imageRef = ref(storage, filePath);

        await uploadBytes(imageRef, img, {
          contentType: img.type,
        });

        uploadedImagePaths.push(filePath);

        const downloadURL = await getDownloadURL(imageRef);

        imageUrls.push(downloadURL);
        imagePaths.push(filePath);
      }

      // 3. Prepare product data
      const productData = {
        ...form,

        title: form.title.trim(),
        price: Number(form.price),
        minOrderQty: Number(form.minOrderQty),

        supplierId: user.uid,

        images: imageUrls,
        imageUrls: imageUrls,

        imageUrl: imageUrls[0] || '',
        imagePath: imagePaths[0] || '',
        imagePaths: imagePaths,

        createdAt: serverTimestamp(),

        views: 0,
        inquiries: 0,
      };

      // 4. Save product in Firestore
      await setDoc(productRef, productData);

      // 5. Update supplier product count
      try {
        await updateDoc(
          doc(db, 'users', user.uid),
          {
            'stats.totalProducts': increment(1),
          }
        );
      } catch (statsError) {
        console.error(
          'Supplier statistics update failed:',
          statsError
        );
      }

      // 6. Success
      alert('Product published successfully!');

      // Clean up image previews
      imagePreviews.forEach((url) =>
        URL.revokeObjectURL(url)
      );

      router.push('/supplier/dashboard');

    } catch (error) {
      console.error('Product upload error:', error);

      // Remove uploaded images if publishing failed
      await Promise.all(
        uploadedImagePaths.map((path) =>
          deleteObject(ref(storage, path)).catch(
            (deleteError) => {
              console.error('Image cleanup failed:', deleteError);
            }
          )
        )
      );

      alert(
        'Failed to publish product. Check Firebase Storage and Firestore permissions.'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">

      <h1 className="text-2xl font-bold mb-6">
        Add New Product
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        <input
          type="text"
          placeholder="Product title"
          required
          className="w-full p-2 border rounded"
          value={form.title}
          onChange={(e) =>
            setForm({
              ...form,
              title: e.target.value,
            })
          }
        />

        <textarea
          placeholder="Description"
          rows={3}
          className="w-full p-2 border rounded"
          value={form.description}
          onChange={(e) =>
            setForm({
              ...form,
              description: e.target.value,
            })
          }
        />

        <select
          className="w-full p-2 border rounded"
          value={form.category}
          onChange={(e) =>
            setForm({
              ...form,
              category: e.target.value,
            })
          }
          required
        >
          <option value="">Select Category</option>

          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Subcategory"
          className="w-full p-2 border rounded"
          value={form.subcategory}
          onChange={(e) =>
            setForm({
              ...form,
              subcategory: e.target.value,
            })
          }
        />

        <div className="flex gap-4">

          <input
            type="number"
            placeholder="Price"
            min="0.01"
            step="0.01"
            required
            className="w-1/2 p-2 border rounded"
            value={form.price}
            onChange={(e) =>
              setForm({
                ...form,
                price: e.target.value,
              })
            }
          />

          <select
            className="w-1/2 p-2 border rounded"
            value={form.unit}
            onChange={(e) =>
              setForm({
                ...form,
                unit: e.target.value,
              })
            }
          >
            <option value="bag">Bag</option>
            <option value="kg">kg</option>
            <option value="ton">Ton</option>
            <option value="piece">Piece</option>
            <option value="sqft">sq.ft.</option>
            <option value="load">Load</option>
          </select>

        </div>

        <input
          type="number"
          placeholder="Minimum Order Quantity"
          min="1"
          required
          className="w-full p-2 border rounded"
          value={form.minOrderQty}
          onChange={(e) =>
            setForm({
              ...form,
              minOrderQty: e.target.value,
            })
          }
        />

        <input
          type="text"
          placeholder="Location"
          required
          className="w-full p-2 border rounded"
          value={form.location}
          onChange={(e) =>
            setForm({
              ...form,
              location: e.target.value,
            })
          }
        />

        <div className="flex gap-4">

          <input
            type="text"
            placeholder="City"
            required
            className="w-1/2 p-2 border rounded"
            value={form.city}
            onChange={(e) =>
              setForm({
                ...form,
                city: e.target.value,
              })
            }
          />

          <input
            type="text"
            placeholder="State"
            required
            className="w-1/2 p-2 border rounded"
            value={form.state}
            onChange={(e) =>
              setForm({
                ...form,
                state: e.target.value,
              })
            }
          />

        </div>

        {/* Product Images */}

        <div>
          <label className="block text-sm font-medium">
            Product Images (Maximum 5)
          </label>

          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            disabled={images.length >= 5}
            className="mt-1"
          />

          <div className="flex gap-3 mt-3 flex-wrap">

            {imagePreviews.map((src, idx) => (
              <div
                key={idx}
                className="relative"
              >
                <img
                  src={src}
                  alt="Product preview"
                  className="w-20 h-20 object-cover rounded border"
                />

                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6"
                >
                  ×
                </button>
              </div>
            ))}

          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-green-700 text-white px-6 py-3 rounded-md w-full disabled:opacity-50"
        >
          {loading
            ? 'Uploading Product...'
            : 'Publish Product'}
        </button>

      </form>
    </div>
  );
}
