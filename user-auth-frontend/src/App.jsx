import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import Layout from "./components/Layout";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import InventoryPage from "./pages/InventoryPage";
import ItemDetailsPage from "./pages/ItemDetailsPage";
import PurchaseOrderPage from "./pages/PurchaseOrderPage";
import PurchaseOrderCreatePage from "./pages/PurchaseOrderCreatePage";
import PurchaseOrderDetailsPage from "./pages/PurchaseOrderDetailsPage";
import PurchaseOrderResubmitPage from "./pages/PurchaseOrderResubmitPage";
import InvoicePage from "./pages/InvoicePage";
import InvoiceDetailsPage from "./pages/InvoiceDetailsPage";
import DepartmentRequestPage from "./pages/DepartmentRequestPage";
import DepartmentRequestCreatePage from "./pages/DepartmentRequestCreatePage";
import DepartmentRequestMinePage from "./pages/DepartmentRequestMinePage";
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
          element={
            <RoleProtectedRoute allowedRoles={["Admin", "WarehouseStaff"]}>
              <PurchaseOrderPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="procurement/purchase-order/new"
          element={
            <RoleProtectedRoute allowedRoles={["Admin", "WarehouseStaff"]}>
              <PurchaseOrderCreatePage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="procurement/purchase-order/:orderId"
          element={
            <RoleProtectedRoute allowedRoles={["Admin", "WarehouseStaff"]}>
              <PurchaseOrderDetailsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="procurement/purchase-order/:orderId/resubmit"
          element={
            <RoleProtectedRoute allowedRoles={["Admin", "WarehouseStaff"]}>
              <PurchaseOrderResubmitPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="procurement/invoice"
          element={
            <RoleProtectedRoute allowedRoles={["Admin", "WarehouseStaff"]}>
              <InvoicePage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="procurement/invoice/:invoiceId"
          element={
            <RoleProtectedRoute allowedRoles={["Admin", "WarehouseStaff"]}>
              <InvoiceDetailsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="department-request"
          element={
            <RoleProtectedRoute allowedRoles={["Admin", "WarehouseStaff"]}>
              <DepartmentRequestPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="department-request/new"
          element={
            <RoleProtectedRoute allowedRoles={["DepartmentMember", "User"]}>
              <DepartmentRequestCreatePage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="department-request/mine"
          element={
            <RoleProtectedRoute allowedRoles={["DepartmentMember", "User"]}>
              <DepartmentRequestMinePage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="department-request/:requestId"
          element={
            <RoleProtectedRoute
              allowedRoles={["Admin", "WarehouseStaff", "DepartmentMember", "User"]}
            >
              <DepartmentRequestDetailsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="storage-zone"
          element={
            <RoleProtectedRoute allowedRoles={["Admin", "WarehouseStaff"]}>
              <StorageZonePage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <RoleProtectedRoute allowedRoles={["Admin", "WarehouseStaff"]}>
              <ReportsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <RoleProtectedRoute allowedRoles={["Admin", "WarehouseStaff"]}>
              <SettingsPage />
            </RoleProtectedRoute>
          }
        />
        <Route path="account" element={<MePage />} />
        <Route path="me" element={<Navigate to="/account" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
