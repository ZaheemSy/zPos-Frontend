import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Inventory from './pages/admin/Inventory';
import Suppliers from './pages/admin/Suppliers';
import PurchaseOrders from './pages/admin/PurchaseOrders';
import Coupons from './pages/admin/Coupons';
import Cashiers from './pages/admin/Cashiers';
import Reports from './pages/admin/Reports';
import BillingScreen from './pages/cashier/BillingScreen';
import HoldSales from './pages/cashier/HoldSales';
import Returns from './pages/cashier/Returns';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import CreateCompany from './pages/superadmin/CreateCompany';
import CompanyDetail from './pages/superadmin/CompanyDetail';
import ProtectedRoute from './components/ProtectedRoute';
import ConnectivityBanner from './components/ConnectivityBanner';
import AdminLayout from './components/layout/AdminLayout';
import CashierLayout from './components/layout/CashierLayout';
import SuperAdminLayout from './components/layout/SuperAdminLayout';

function App() {
  return (
    <BrowserRouter>
      <ConnectivityBanner />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/products" element={<Products />} />
            <Route path="/admin/inventory" element={<Inventory />} />
            <Route path="/admin/suppliers" element={<Suppliers />} />
            <Route path="/admin/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/admin/coupons" element={<Coupons />} />
            <Route path="/admin/customers" element={<Customers />} />
            <Route path="/admin/cashiers" element={<Cashiers />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['cashier']} />}>
          <Route element={<CashierLayout />}>
            <Route path="/cashier" element={<BillingScreen />} />
            <Route path="/cashier/customers" element={<Customers />} />
            <Route path="/cashier/held-sales" element={<HoldSales />} />
            <Route path="/cashier/returns" element={<Returns />} />
            <Route path="/cashier/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
          <Route element={<SuperAdminLayout />}>
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/new" element={<CreateCompany />} />
            <Route path="/super-admin/companies/:id" element={<CompanyDetail />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
