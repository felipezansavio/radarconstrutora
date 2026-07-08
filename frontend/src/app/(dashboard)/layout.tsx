import { AuthGuard } from "@/components/layout/auth-guard";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <div className="bg-muted/20 flex min-h-screen">
        <aside className="bg-background fixed inset-y-0 left-0 z-30 hidden w-64 border-r lg:block">
          <SidebarNav />
        </aside>
        <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
          <Topbar />
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
