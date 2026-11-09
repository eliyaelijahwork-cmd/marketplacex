
export const BUSINESS_TYPES = ["Manufacturer", "Dealer", "Distributor", "Wholesaler", "Retailer", "Supplier", "Service provider", "Contractor", "Importer", "Exporter"] as const;
export type SupplierRegistrationInput = {
  fullName: string; email: string; mobileNumber: string; whatsappNumber: string; businessName: string;
  businessCategory: string; subcategoryId: string; description: string; country: string; state: string;
  district: string; city: string; area: string; businessAddress: string; pinCode: string;
  latitude: number | null; longitude: number | null; businessTypes: string[];
  logoUrl: string; coverImageUrl: string; businessPhotos: string[]; gstNumber: string; registrationDocumentUrl: string; registrationDocumentPath: string;
};
const maxLengths: Record<string, number> = {
  fullName: 120, email: 180, mobileNumber: 16, whatsappNumber: 16, businessName: 160, businessCategory: 80,
  subcategoryId: 120, description: 2000, country: 100, state: 120, district: 120, city: 120, area: 120,
  businessAddress: 500, pinCode: 10, logoUrl: 2048, coverImageUrl: 2048, gstNumber: 20, registrationDocumentUrl: 2048, registrationDocumentPath: 512,
};
function text(input: Record<string, unknown>, field: string, max: number, required = true) {
  const value = input[field];
  if (typeof value !== "string" || value.trim().length > max || (required && !value.trim())) return null;
  return value.trim();
}
function validAssetUrl(value: string) { return !value || (/^https:\/\//i.test(value) && value.length <= 2048); }

export function validateSupplierRegistration(value: unknown): SupplierRegistrationInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const allowedKeys = [...Object.keys(maxLengths), "latitude", "longitude", "businessTypes", "businessPhotos"];
  if (Object.keys(input).some((key) => !allowedKeys.includes(key))) return null;
  const fields: Record<string, string> = {};
  for (const [field, max] of Object.entries(maxLengths)) {
  const optional = ["description", "area", "logoUrl", "coverImageUrl", "gstNumber", "registrationDocumentUrl", "registrationDocumentPath"].includes(field);
    const result = text(input, field, max, !optional);
    if (result === null) return null;
    fields[field] = result;
  }
  const mobile = fields.mobileNumber.replace(/\D/g, "");
  const whatsapp = fields.whatsappNumber.replace(/\D/g, "");
  const types = input.businessTypes;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.toLowerCase()) || !/^[6-9]\d{9}$/.test(mobile) || !/^[6-9]\d{9}$/.test(whatsapp) || !/^[1-9]\d{5}$/.test(fields.pinCode) || !Array.isArray(types) || types.length < 1 || types.length > BUSINESS_TYPES.length || types.some((item) => typeof item !== "string" || !(BUSINESS_TYPES as readonly string[]).includes(item)) || !validAssetUrl(fields.logoUrl) || !validAssetUrl(fields.coverImageUrl) || !validAssetUrl(fields.registrationDocumentUrl)) return null;
  const photos = input.businessPhotos;
  if (!Array.isArray(photos) || photos.length > 10 || photos.some((item) => typeof item !== "string" || !validAssetUrl(item))) return null;
  const latitude = input.latitude === null || input.latitude === "" || input.latitude === undefined ? null : Number(input.latitude);
  const longitude = input.longitude === null || input.longitude === "" || input.longitude === undefined ? null : Number(input.longitude);
  if ((latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) || (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) || (latitude === null) !== (longitude === null)) return null;
  return {
    fullName: fields.fullName, email: fields.email.toLowerCase(), mobileNumber: `+91${mobile}`, whatsappNumber: `+91${whatsapp}`,
    businessName: fields.businessName, businessCategory: fields.businessCategory, subcategoryId: fields.subcategoryId,
    description: fields.description, country: fields.country, state: fields.state, district: fields.district,
    city: fields.city, area: fields.area, businessAddress: fields.businessAddress, pinCode: fields.pinCode,
    latitude, longitude, businessTypes: [...new Set(types as string[])], businessPhotos: photos as string[],
    logoUrl: fields.logoUrl, coverImageUrl: fields.coverImageUrl, gstNumber: fields.gstNumber,
    registrationDocumentUrl: fields.registrationDocumentUrl, registrationDocumentPath: fields.registrationDocumentPath,
  };
}
