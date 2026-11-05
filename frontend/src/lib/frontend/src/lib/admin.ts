
import { auth } from "@/lib/firebase";

const ADMIN_EMAIL = "YOUR_ADMIN_GMAIL@gmail.com";

export async function isAdminUser() {
  const user = auth.currentUser;

  if (!user) return false;

  // Refresh authentication token
  const token = await user.getIdTokenResult(true);

  return (
    user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
    user.emailVerified === true &&
    token.claims.email_verified === true
  );
}

