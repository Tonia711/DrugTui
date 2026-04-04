// src/components/Layout.jsx
import { Outlet } from "react-router-dom";
import { NavLink, useNavigate } from "react-router-dom";
import useAxios from "../hooks/useAxios";
import {
  LayoutDashboard,
  Package,
  PackageCheck,
  ChevronDown,
  Boxes,
  LogOut,
  NotebookPen,
  FileText,
  Settings,
  User,
} from "lucide-react";
import logoImage from "../assets/159be5b2673509fff982b6d650d9a19a8a77d2d1.png";

function Layout() {
  const navigate = useNavigate();
  const { data: user } = useAxios({ method: "get", url: "/Users/me" });
  const normalizedRole = user?.role === "User" ? "DepartmentMember" : user?.role;
  const isWarehouseUser =
    normalizedRole === "Admin" || normalizedRole === "WarehouseStaff";

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

  const subNavClass = ({ isActive }) =>
    `w-full flex items-center px-3 py-1.5 rounded-lg transition-colors text-left text-xs ml-8 ${
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
            {isWarehouseUser ? (
              <>
                <div className="space-y-1">
                  <div className="w-full flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg text-left text-gray-600">
                    <div className="flex items-center gap-3">
                      <PackageCheck size={16} />
                      <span className="text-xs">Procurement</span>
                    </div>
                    <ChevronDown size={14} />
                  </div>
                  <NavLink to="/procurement/purchase-order" className={subNavClass}>
                    Purchase Order
                  </NavLink>
                  <NavLink to="/procurement/invoice" className={subNavClass}>
                    Invoice
                  </NavLink>
                </div>

                <NavLink to="/department-request" className={navClass}>
                  <Boxes size={16} />
                  <span className="text-xs">Department Request</span>
                </NavLink>
              </>
            ) : (
              <NavLink to="/department-request/new" className={navClass}>
                <Boxes size={16} />
                <span className="text-xs">Add New Request</span>
              </NavLink>
            )}
          </nav>
        </div>

        <div className="flex-1">
          {isWarehouseUser && (
            <>
              <div className="text-xs text-gray-500 mb-3 px-3">Management</div>
              <nav className="space-y-1">
                <NavLink to="/storage-zone" className={navClass}>
                  <NotebookPen size={16} />
                  <span className="text-xs">Storage Zone</span>
                </NavLink>
                <NavLink to="/reports" className={navClass}>
                  <FileText size={16} />
                  <span className="text-xs">Reports</span>
                </NavLink>
                <NavLink to="/settings" className={navClass}>
                  <Settings size={16} />
                  <span className="text-xs">Settings</span>
                </NavLink>
              </nav>
            </>
          )}
        </div>

        <div className="mt-auto pt-6 border-t border-gray-200">
          <NavLink to="/account" className={navClass}>
            <User size={16} />
            <span className="text-xs">Account</span>
          </NavLink>

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
