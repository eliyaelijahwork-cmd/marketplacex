"use client";

export default function AuthGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const userRole = "supplier";

  if (!allowedRoles.includes(userRole)) {
    return <div>Access Denied</div>;
  }

  return <>{children}</>;
}