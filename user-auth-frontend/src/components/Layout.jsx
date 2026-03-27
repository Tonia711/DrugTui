// src/components/Layout.jsx
import { Outlet } from "react-router-dom";
import { NavLink, useNavigate } from "react-router-dom";
import useAxios from "../hooks/useAxios";
import {
  LayoutDashboard,
  Package,
  User,
  LogOut,
  Building2,
  FileText,
  Settings,
} from "lucide-react";
import logoImage from "../assets/159be5b2673509fff982b6d650d9a19a8a77d2d1.png";

function Layout() {
  const navigate = useNavigate();
  const { data: user } = useAxios({ method: "get", url: "/Users/me" });

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navClass = ({ isActive }) =>
    `w-full flex items-center gap-3 px-3 py-1.5 rounded-lg transition-colors text-left ${
      isActive
        ? "bg-gray-100 text-gray-900 font-bold"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-64 bg-gray-50 border-r border-gray-200 p-6 flex flex-col">
        <div className="mb-8 flex items-end gap-3 relative scale-75 origin-left">
          <img
            src={logoImage}
            alt="DrugTui logo"
            className="w-24 h-24 object-contain translate-y-5 z-0"
          />
          <span className="text-xl text-gray-900 font-bold relative z-10 -translate-x-[5px]">
            DrugTui
          </span>
        </div>

        <div className="mb-8">
          <div className="text-xs text-gray-500 mb-3 px-3">Main</div>
          <nav className="space-y-1">
            <NavLink to="/dashboard" className={navClass}>
              <LayoutDashboard size={16} />
              <span className="text-xs">Dashboard</span>
            </NavLink>
            <NavLink to="/inventory" className={navClass}>
              <Package size={16} />
              <span className="text-xs">Inventory</span>
            </NavLink>
            <NavLink to="/me" className={navClass}>
              <User size={16} />
              <span className="text-xs">Profile</span>
            </NavLink>
          </nav>
        </div>

        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-3 px-3">Management</div>
          <nav className="space-y-1">
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-gray-400 text-left cursor-not-allowed"
              disabled
            >
              <Building2 size={16} />
              <span className="text-xs">Storage Zone</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-gray-400 text-left cursor-not-allowed"
              disabled
            >
              <FileText size={16} />
              <span className="text-xs">Reports</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-gray-400 text-left cursor-not-allowed"
              disabled
            >
              <Settings size={16} />
              <span className="text-xs">Settings</span>
            </button>
          </nav>
        </div>

        <div className="mt-auto pt-6 border-t border-gray-200">
          <div className="px-3 py-2">
            <div className="text-xs text-gray-900 font-bold">
              {user?.username || "Pharmacist"}
            </div>
            <div className="text-xs text-gray-500 mt-0.5 break-all">
              {user?.email || ""}
            </div>
          </div>
          <button
            className="w-full mt-2 flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg px-3 py-2 hover:bg-gray-800 transition-colors"
            onClick={handleLogout}
          >
            <LogOut size={14} />
            <span className="text-xs">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-white">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
