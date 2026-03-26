import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../util/api";

function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem("token");
      if (!token) return setChecking(false);
      try {
        await api.get("/Users/me");
      } catch {
        localStorage.removeItem("token");
      } finally {
        setChecking(false);
      }
    };
    fetchMe();
  }, []);

  if (checking) return null;
  if (!localStorage.getItem("token")) return <Navigate to="/login" replace />;

  return children;
}

export default ProtectedRoute;
