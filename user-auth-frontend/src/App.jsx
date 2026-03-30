import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import InventoryPage from "./pages/InventoryPage";
import ItemDetailsPage from "./pages/ItemDetailsPage";
import PurchaseOrderPage from "./pages/PurchaseOrderPage";
import InvoicePage from "./pages/InvoicePage";
import DepartmentRequestPage from "./pages/DepartmentRequestPage";
import DepartmentRequestDetailsPage from "./pages/DepartmentRequestDetailsPage";
import StorageZonePage from "./pages/StorageZonePage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
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
        <Route path="inventory/:itemId" element={<ItemDetailsPage />} />
        <Route
          path="procurement/purchase-order"
          element={<PurchaseOrderPage />}
        />
        <Route path="procurement/invoice" element={<InvoicePage />} />
        <Route path="department-request" element={<DepartmentRequestPage />} />
        <Route
          path="department-request/:requestId"
          element={<DepartmentRequestDetailsPage />}
        />
        <Route path="storage-zone" element={<StorageZonePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="account" element={<MePage />} />
        <Route path="me" element={<Navigate to="/account" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
