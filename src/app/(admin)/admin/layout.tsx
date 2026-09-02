import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { navFor, requireAdminUser } from "@/lib/admin";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — IWM Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const user = await requireAdminUser();
  return (
    <AdminShell nav={navFor(user.role)} user={user}>
      {children}
    </AdminShell>
  );
}
