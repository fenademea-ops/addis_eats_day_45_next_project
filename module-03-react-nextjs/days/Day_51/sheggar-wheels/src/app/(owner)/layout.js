import RouteGuard from '@/components/auth/RouteGuard';
import OwnerSidebar from '@/components/navigation/OwnerSidebar';

export default function OwnerLayout({ children }) {
  return (
    <RouteGuard requiredRole="owner">
      <div className="flex-1 flex flex-col md:flex-row bg-slate-900 text-slate-100 min-h-[calc(100vh-2rem)]">
        <OwnerSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </RouteGuard>
  );
}
