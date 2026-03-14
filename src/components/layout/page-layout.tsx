import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Header } from "@/components/layout/header";

interface PageLayoutProps {
  children: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:pl-64">
        <Header />
        <main className="p-4 md:p-6 pb-24 md:pb-6 space-y-6">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
