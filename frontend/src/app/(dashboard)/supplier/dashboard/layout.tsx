import AuthGuard from "../../../../components/AuthGuard";

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["supplier"]}>
      {children}
    </AuthGuard>
  );
}