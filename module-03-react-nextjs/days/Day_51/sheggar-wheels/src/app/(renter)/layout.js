import RouteGuard from '@/components/auth/RouteGuard';
import RenterSidebar from '@/components/navigation/RenterSidebar';

export default function RenterLayout({ children }) {
  return (
    <RouteGuard requiredRole="renter">
      <div className="flex-1 flex flex-col md:flex-row bg-slate-50 min-h-[calc(100vh-2rem)]">
        <RenterSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </RouteGuard>
  );
}
