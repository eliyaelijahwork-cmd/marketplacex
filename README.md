# MarketPlaceX

Construction Material MarketPlaceX is an OLX-style marketplace for construction materials built with Next.js 16, React 19, TypeScript, Tailwind CSS, Firebase Authentication, Cloud Firestore, and Firebase Storage.

## Main Routes

- `/` - marketplace home with hero search, location action, categories, featured materials, and suppliers.
- `/materials` - searchable material listing page with category, price, city, and distance filters.
- `/materials/[id]` - material details with gallery, supplier card, map, similar materials, Call Now, and WhatsApp.
- `/suppliers` - nearby supplier directory sorted by user location when available.
- `/suppliers/[id]` - supplier profile with map, contact buttons, and active listings.
- `/login` and `/signup` - Firebase Google Sign-In and Phone OTP login.
- `/supplier-dashboard` - protected supplier dashboard with profile, listings, add/edit/delete, image uploads, and analytics.

## Implemented Features

- Browser geolocation with permission prompt, loading/error states, reverse geocoding, localStorage persistence, navbar display, and address auto-fill.
- Firebase Authentication with Google Sign-In, Phone OTP, logout, auth context, and protected supplier dashboard.
- Firestore-backed `users` and `materials` collections with demo seed fallback while Firebase is empty or unavailable.
- Firebase Storage image uploads with previews, progress, type validation, size validation, and up to 10 material images.
- Nearby material and supplier sorting with distance calculations.
- Direct contact actions using `tel:+91...` and `https://wa.me/91...`.
- Responsive OLX-style UI with sticky header, search, category navigation, listing cards, detail pages, loading skeletons, and error boundary.
- Firestore rules, Storage rules, and Firestore indexes for secure deployment.

## Firebase Setup

1. Put Firebase web app values in root `.env.local`.

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

2. In Firebase Console, enable Authentication providers:

- Google
- Phone

3. Deploy Firestore and Storage rules when Firebase CLI access is available.

```bash
npx -y firebase-tools@latest deploy --only firestore:rules,firestore:indexes,storage
```

The rules are configured in `firebase.json`, `firestore.rules`, `firestore.indexes.json`, and `storage.rules`.

## Data Model

`users/{uid}`

```ts
{
  uid,
  supplierName,
  companyName,
  email,
  phoneNumber,
  whatsappNumber,
  profilePhoto,
  address,
  city,
  state,
  latitude,
  longitude,
  description,
  createdAt
}
```

`materials/{id}`

```ts
{
  id,
  supplierId,
  materialName,
  category,
  price,
  quantity,
  unit,
  description,
  images,
  address,
  city,
  state,
  latitude,
  longitude,
  createdAt
}
```

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run lint
npm run build
```

Both commands pass in the current workspace.
