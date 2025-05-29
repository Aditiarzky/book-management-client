import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, FileText, Tags, LayoutDashboard, Menu, X, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore"; // Impor auth store
import { toast } from "sonner"; 
import { useNavigate } from "@tanstack/react-router";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "books",
    label: "Kelola Buku",
    icon: BookOpen,
  },
  {
    id: "chapters",
    label: "Kelola Chapter",
    icon: FileText,
  },
  {
    id: "genres",
    label: "Kelola Genre",
    icon: Tags,
  },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout } = useAuthStore(); // Ambil fungsi logout dari auth store
  const navigate = useNavigate(); // Inisialisasi useNavigate untuk redirect

  // Fungsi untuk menangani logout
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate({to:"/login"}); // Arahkan ke halaman login setelah logout
      setIsCollapsed(true); // Tutup sidebar di perangkat mobile
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 transition-transform duration-300 lg:relative lg:translate-x-0",
          isCollapsed ? "-translate-x-full" : "translate-x-0",
          "w-64 flex flex-col"
        )}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Admin Panel</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="lg:hidden"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    activeTab === item.id && "bg-primary text-gray-900 hover:bg-primary"
                  )}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsCollapsed(true);
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              );
            })}
            {/* Tombol Logout */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </nav>
        </ScrollArea>
      </div>

      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsCollapsed(false)}
        className={cn("fixed top-4 left-4 z-40 lg:hidden", !isCollapsed && "hidden")}
      >
        <Menu className="w-4 h-4" />
      </Button>
    </>
  );
}