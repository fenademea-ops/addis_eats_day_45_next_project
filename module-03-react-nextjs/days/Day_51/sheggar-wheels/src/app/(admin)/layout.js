import RouteGuard from '@/components/auth/RouteGuard';
import AdminSidebar from '@/components/navigation/AdminSidebar';

export default function AdminLayout({ children }) {
  return (
    <RouteGuard requiredRole="admin">
      <div className="flex-1 flex flex-col md:flex-row bg-slate-950 text-slate-100 min-h-[calc(100vh-2rem)]">
        <AdminSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </RouteGuard>
  );
}
