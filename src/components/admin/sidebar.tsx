import { useState } from "react";
import { cn } from "@/lib/utils";
import { BookOpen, FileText, Tags, LayoutDashboard, Menu, X, LogOut, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "books", label: "Kelola Buku", icon: BookOpen },
  { id: "chapters", label: "Kelola Chapter", icon: FileText },
  { id: "genres", label: "Kelola Genre", icon: Tags },
];

function NavContent({ activeTab, onTabChange, onClose }: { activeTab: string; onTabChange: (t: string) => void; onClose?: () => void }) {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await logout(); toast.success("Berhasil logout"); navigate({ to: "/login" }); }
    catch { toast.error("Gagal logout"); }
  };

  return (
    <div className="flex flex-col h-full select-none">
      {/* Brand */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
            <LayoutDashboard className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-[15px] text-gray-900 tracking-tight">Admin Panel</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Menu</p>
        {menuItems.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button key={id} onClick={() => { onTabChange(id); onClose?.(); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group text-left",
                active ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              )}>
              <Icon className={cn("w-4 h-4 shrink-0 transition-colors", active ? "text-white" : "text-gray-400 group-hover:text-gray-700")} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-white/40 shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-gray-100 shrink-0">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-150 group">
          <LogOut className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop — always visible */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-gray-100 bg-white h-screen sticky top-0 z-30">
        <NavContent activeTab={activeTab} onTabChange={onTabChange} />
      </aside>

      {/* Mobile hamburger */}
      <button onClick={() => setOpen(true)}
        className={cn("lg:hidden fixed top-[14px] left-4 z-50 w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 shadow-sm transition-all", open && "opacity-0 pointer-events-none")}>
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile overlay */}
      <div onClick={() => setOpen(false)}
        className={cn("lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-200", open ? "opacity-100" : "opacity-0 pointer-events-none")} />

      {/* Mobile drawer */}
      <aside className={cn("lg:hidden fixed top-0 left-0 z-50 h-screen w-60 bg-white border-r border-gray-100 shadow-xl transition-transform duration-300", open ? "translate-x-0" : "-translate-x-full")}>
        <NavContent activeTab={activeTab} onTabChange={onTabChange} onClose={() => setOpen(false)} />
      </aside>
    </>
  );
}
