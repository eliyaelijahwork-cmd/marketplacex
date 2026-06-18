"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useLocation } from "@/app/contexts/LocationContext";
import {
  allowedImageTypes,
  maxImageSizeBytes,
  saveSupplierProfile,
} from "@/app/lib/firebase/marketplace";

const inputClass =
  "rounded-md border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100";

type ProfileFormState = {
  supplierName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  whatsappNumber: string;
  address: string;
  city: string;
  state: string;
  latitude: string;
  longitude: string;
  description: string;
  profilePhoto: string;
};

export default function SupplierProfileForm() {
  const { user, profile, firebaseReady } = useAuth();
  const { location } = useLocation();
  const [form, setForm] = useState<ProfileFormState>(() => emptyForm());
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
    if (!profile && user) {
      setForm((current) => ({
        ...current,
        supplierName: user.displayName ?? current.supplierName,
        companyName: user.displayName ?? current.companyName,
        email: user.email ?? current.email,
        phoneNumber: user.phoneNumber ?? current.phoneNumber,
        whatsappNumber: user.phoneNumber ?? current.whatsappNumber,
        profilePhoto: user.photoURL ?? current.profilePhoto,
      }));
      return;
    }

    if (profile) {
      setForm({
        supplierName: profile.supplierName,
        companyName: profile.companyName,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        whatsappNumber: profile.whatsappNumber,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        latitude: String(profile.latitude || ""),
        longitude: String(profile.longitude || ""),
        description: profile.description,
        profilePhoto: profile.profilePhoto,
      });
    }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [profile, user]);

  const canAutoFill = useMemo(() => Boolean(location), [location]);

  function updateField(name: keyof ProfileFormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      revokePreview(photoPreview);
      setPhotoPreview("");
      setPhotoFile(null);
      return;
    }
    if (!allowedImageTypes.includes(file.type)) {
      setError("Profile photo must be JPG, PNG, or WebP.");
      event.target.value = "";
      return;
    }
    if (file.size > maxImageSizeBytes) {
      setError("Profile photo must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    revokePreview(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      return;
    }

    setSaving(true);
    setStatus("");
    setError("");

    try {
      await saveSupplierProfile(
        user.uid,
        {
          supplierName: form.supplierName.trim(),
          companyName: form.companyName.trim(),
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim(),
          whatsappNumber: form.whatsappNumber.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          description: form.description.trim(),
          profilePhoto: form.profilePhoto,
        },
        photoFile,
      );
      setStatus("Supplier profile saved.");
      setPhotoFile(null);
      revokePreview(photoPreview);
      setPhotoPreview("");
    } catch (reason) {
      console.error(reason);
      setError(reason instanceof Error ? reason.message : "Could not save supplier profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
      {!firebaseReady && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          Firebase is not configured. Profile saving is disabled until root `.env.local` is set.
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <img
          alt="Supplier profile preview"
          className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
          src={photoPreview || form.profilePhoto || "/assets/construction-marketplace-hero.png"}
        />
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Profile photo
          <input
            accept={allowedImageTypes.join(",")}
            className="text-sm"
            onChange={handlePhotoChange}
            type="file"
          />
        </label>
      </div>

      <div
        className={`rounded-lg border p-4 text-sm font-semibold ${
          profile?.isVerified
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-900"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-base font-black">
            {profile?.isVerified ? "Verified supplier" : "Verification pending"}
          </p>
          <span className="rounded-md bg-white/80 px-2.5 py-1 text-xs font-black uppercase">
            {profile?.verificationStatus ?? "pending"}
          </span>
        </div>
        <p className="mt-2 leading-6">
          {profile?.isVerified
            ? "This supplier can post and update material listings."
            : "MarketPlaceX must verify the supplier before material posting is enabled."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Supplier Name" name="supplierName" onChange={updateField} required value={form.supplierName} />
        <Field label="Company Name" name="companyName" onChange={updateField} required value={form.companyName} />
        <Field label="Email" name="email" onChange={updateField} type="email" value={form.email} />
        <Field label="Phone Number" name="phoneNumber" onChange={updateField} required type="tel" value={form.phoneNumber} />
        <Field label="WhatsApp Number" name="whatsappNumber" onChange={updateField} required type="tel" value={form.whatsappNumber} />
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
            placeholder="What do you supply, which areas do you serve, and how fast can you dispatch?"
            value={form.description}
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          className="rounded-md border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-800 transition hover:bg-cyan-100 disabled:opacity-60"
          disabled={!canAutoFill}
          onClick={fillFromLocation}
          type="button"
        >
          Auto-fill from current location
        </button>
        <button
          className="rounded-md bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
          disabled={saving || !firebaseReady}
          type="submit"
        >
          {saving ? "Saving..." : "Save Profile"}
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

function revokePreview(preview: string) {
  if (preview.startsWith("blob:")) {
    URL.revokeObjectURL(preview);
  }
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
  name: keyof ProfileFormState;
  value: string;
  onChange: (name: keyof ProfileFormState, value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <input
        className={inputClass}
        onChange={(event) => onChange(name, event.target.value)}
        required={required}
        step={type === "number" ? "any" : undefined}
        type={type}
        value={value}
      />
    </label>
  );
}

function emptyForm(): ProfileFormState {
  return {
    supplierName: "",
    companyName: "",
    email: "",
    phoneNumber: "",
    whatsappNumber: "",
    address: "",
    city: "",
    state: "",
    latitude: "",
    longitude: "",
    description: "",
    profilePhoto: "",
  };
}
