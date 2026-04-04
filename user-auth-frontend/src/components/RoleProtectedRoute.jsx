import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../util/api";

function RoleProtectedRoute({ children, allowedRoles = [] }) {
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setChecking(false);
        return;
      }

      try {
        const res = await api.get("/Users/me");
        const fetchedRole = res.data?.role || null;
        setRole(fetchedRole === "User" ? "DepartmentMember" : fetchedRole);
      } catch {
        localStorage.removeItem("token");
      } finally {
        setChecking(false);
      }
    };

    fetchMe();
  }, []);

  if (checking) return null;

  if (!localStorage.getItem("token")) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.length || allowedRoles.includes(role)) {
    return children;
  }

  return <Navigate to="/dashboard" replace />;
}

export default RoleProtectedRoute;
