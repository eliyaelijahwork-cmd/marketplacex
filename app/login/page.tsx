import { Suspense } from "react";
import AuthForm from "../components/AuthForm";

export default function LoginPage() {
  return (
    <main>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </main>
  );
}
