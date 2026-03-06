import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";

export function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#08090d]">
      <Sidebar />

      <div className="w-px min-w-px bg-[#1e293b]" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
