"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { categories, type MaterialListing, type SupplierProfile } from "@/app/data/marketplace";
import { useLocation } from "@/app/contexts/LocationContext";
import {
  allowedImageTypes,
  createMaterialListing,
  isVerifiedSupplier,
  maxListingImages,
  updateMaterialListing,
  validateImageFiles,
} from "@/app/lib/firebase/marketplace";

type MaterialFormProps = {
  supplier: SupplierProfile;
  initialMaterial?: MaterialListing | null;
  onSaved?: () => void;
};

type MaterialFormState = {
  materialName: string;
  category: string;
  price: string;
  quantity: string;
  unit: string;
  description: string;
  address: string;
  city: string;
  state: string;
  latitude: string;
  longitude: string;
};

const units = ["Ton", "Bag", "Piece", "Kg", "Meter", "Sheet", "Box", "Roll", "Unit"];
const inputClass =
  "rounded-md border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100";

export default function MaterialForm({ supplier, initialMaterial, onSaved }: MaterialFormProps) {
  const { location } = useLocation();
  const verifiedSupplier = isVerifiedSupplier(supplier);
  const [form, setForm] = useState<MaterialFormState>(() =>
    getInitialForm(supplier, initialMaterial),
  );
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const previewsRef = useRef<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setForm(getInitialForm(supplier, initialMaterial));
      setFiles([]);
      revokePreviews(previewsRef.current);
      previewsRef.current = [];
      setPreviews([]);
      setProgress(0);
      setStatus("");
      setError("");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialMaterial, supplier]);

  function updateField(name: keyof MaterialFormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function fillFromProfile() {
    setForm((current) => ({
      ...current,
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      latitude: String(supplier.latitude || ""),
      longitude: String(supplier.longitude || ""),
    }));
  }

  function fillFromLocation() {
    if (!location) {
      return;
    }

    setForm((current) => ({
      ...current,
      address: location.address,
      city: location.city,
      state: location.state,
      latitude: String(location.latitude),
      longitude: String(location.longitude),
    }));
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    const message = validateImageFiles(selectedFiles);
    if (message) {
      setError(message);
      event.target.value = "";
      return;
    }

    setError("");
    revokePreviews(previewsRef.current);
    const nextPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    previewsRef.current = nextPreviews;
    setFiles(selectedFiles);
    setPreviews(nextPreviews);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!verifiedSupplier) {
      setError("Only verified suppliers can post or update materials.");
      return;
    }
    setSaving(true);
    setStatus("");
    setError("");
    setProgress(0);

    try {
      const input = {
        materialName: form.materialName.trim(),
        category: form.category,
        price: Number(form.price),
        quantity: form.quantity.trim(),
        unit: form.unit,
        description: form.description.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      };

      if (initialMaterial) {
        await updateMaterialListing(initialMaterial, input, files, supplier, setProgress);
        setStatus("Listing updated.");
      } else {
        await createMaterialListing(input, supplier, files, setProgress);
        setForm(getInitialForm(supplier, null));
        setFiles([]);
        revokePreviews(previewsRef.current);
        previewsRef.current = [];
        setPreviews([]);
        setStatus("Material listing posted.");
      }

      onSaved?.();
    } catch (reason) {
      console.error(reason);
      setError(reason instanceof Error ? reason.message : "Could not save material listing.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
      {!verifiedSupplier && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          Material posting is locked until this supplier is verified.
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Material Name" name="materialName" onChange={updateField} required value={form.materialName} />
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Category
          <select
            className={inputClass}
            onChange={(event) => updateField("category", event.target.value)}
            required
            value={form.category}
          >
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <Field label="Price" name="price" onChange={updateField} required type="number" value={form.price} />
        <Field label="Quantity" name="quantity" onChange={updateField} required value={form.quantity} />
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Unit
          <select
            className={inputClass}
            onChange={(event) => updateField("unit", event.target.value)}
            required
            value={form.unit}
          >
            {units.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </label>
        <Field label="City" name="city" onChange={updateField} required value={form.city} />
        <Field label="State" name="state" onChange={updateField} required value={form.state} />
        <Field label="Latitude" name="latitude" onChange={updateField} required type="number" value={form.latitude} />
        <Field label="Longitude" name="longitude" onChange={updateField} required type="number" value={form.longitude} />
        <label className="grid gap-2 text-sm font-bold text-slate-700 md:col-span-2">
          Address
          <textarea
            className={`${inputClass} min-h-20`}
            onChange={(event) => updateField("address", event.target.value)}
            required
            value={form.address}
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700 md:col-span-2">
          Description
          <textarea
            className={`${inputClass} min-h-24`}
            onChange={(event) => updateField("description", event.target.value)}
            required
            value={form.description}
          />
        </label>
      </div>

      <div className="grid gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">Material Images</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Upload up to {maxListingImages} JPG, PNG, or WebP images. New uploads replace existing images while editing.
            </p>
          </div>
          <input
            accept={allowedImageTypes.join(",")}
            multiple
            onChange={handleFiles}
            type="file"
          />
        </div>

        {(previews.length > 0 || initialMaterial?.images.length) && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {(previews.length ? previews : initialMaterial?.images ?? []).slice(0, 10).map((image, index) => (
              <img
                alt={`Selected material preview ${index + 1}`}
                className="aspect-square rounded-md object-cover"
                key={`${image}-${index}`}
                src={image}
              />
            ))}
          </div>
        )}

        {saving && (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-cyan-700 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-bold text-slate-600">{progress}% uploaded</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-black text-slate-800 transition hover:border-cyan-500 hover:text-cyan-700"
            onClick={fillFromProfile}
            type="button"
          >
            Use profile address
          </button>
          <button
            className="rounded-md border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-800 transition hover:bg-cyan-100 disabled:opacity-60"
            disabled={!location}
            onClick={fillFromLocation}
            type="button"
          >
            Use my location
          </button>
        </div>
        <button
          className="rounded-md bg-cyan-700 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-800 disabled:cursor-wait disabled:opacity-70"
          disabled={saving || !verifiedSupplier}
          type="submit"
        >
          {saving ? "Saving..." : initialMaterial ? "Update Listing" : "Post Material"}
        </button>
      </div>

      {(status || error) && (
        <p
          className={`rounded-md p-3 text-sm font-semibold ${
            error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || status}
        </p>
      )}
    </form>
  );
}

function revokePreviews(previews: string[]) {
  previews.forEach((preview) => {
    if (preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
  });
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  name: keyof MaterialFormState;
  value: string;
  onChange: (name: keyof MaterialFormState, value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <input
        className={inputClass}
        min={type === "number" ? "0" : undefined}
        onChange={(event) => onChange(name, event.target.value)}
        required={required}
        step={type === "number" ? "any" : undefined}
        type={type}
        value={value}
      />
    </label>
  );
}

function getInitialForm(
  supplier: SupplierProfile,
  material?: MaterialListing | null,
): MaterialFormState {
  if (material) {
    return {
      materialName: material.materialName,
      category: material.category,
      price: String(material.price),
      quantity: material.quantity,
      unit: material.unit,
      description: material.description,
      address: material.address,
      city: material.city,
      state: material.state,
      latitude: String(material.latitude),
      longitude: String(material.longitude),
    };
  }

  return {
    materialName: "",
    category: categories[0]?.slug ?? "aggregates",
    price: "",
    quantity: "",
    unit: "Ton",
    description: "",
    address: supplier.address,
    city: supplier.city,
    state: supplier.state,
    latitude: supplier.latitude ? String(supplier.latitude) : "",
    longitude: supplier.longitude ? String(supplier.longitude) : "",
  };
}
