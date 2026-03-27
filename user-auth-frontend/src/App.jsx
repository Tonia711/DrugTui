import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import InventoryPage from "./pages/InventoryPage";
import MePage from "./pages/MePage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="home" element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<HomePage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="me" element={<MePage />} />
      </Route>
    </Routes>
  );
}

export default App;
