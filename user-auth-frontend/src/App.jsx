import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import InventoryPage from "./pages/InventoryPage";
import MePage from "./pages/MePage";
import PlaceholderPage from "./pages/PlaceholderPage";

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
        <Route path="procurement/purchase-order" element={<PlaceholderPage title="Purchase Order" subtitle="Procurement / Purchase Order page." />} />
        <Route path="procurement/invoice" element={<PlaceholderPage title="Invoice" subtitle="Procurement / Invoice page." />} />
        <Route path="department-request" element={<PlaceholderPage title="Department Request" subtitle="Department request workflow page." />} />
        <Route path="storage-zone" element={<PlaceholderPage title="Storage Zone" subtitle="Storage zone management page." />} />
        <Route path="reports" element={<PlaceholderPage title="Reports" subtitle="Reporting and analytics page." />} />
        <Route path="settings" element={<PlaceholderPage title="Settings" subtitle="System settings page." />} />
        <Route path="account" element={<MePage />} />
        <Route path="me" element={<Navigate to="/account" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
