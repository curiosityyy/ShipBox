import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";

export function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-[#08090d]">
      <Sidebar />

      <div className="w-px min-w-px bg-[#1e293b]" />

      <main className="flex-1 overflow-y-auto">
        <div key={location.pathname} className="max-w-[1100px] mx-auto p-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
