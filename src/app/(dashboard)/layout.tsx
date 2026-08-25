import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export const dynamic = "force-dynamic";

const Layout = ({ children }: { children: React.ReactNode; }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="dark">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;