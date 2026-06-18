import { Suspense } from "react";
import AuthForm from "../components/AuthForm";

export default function SignupPage() {
  return (
    <main>
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </main>
  );
}
