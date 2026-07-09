import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Inventory from './pages/admin/Inventory';
import Suppliers from './pages/admin/Suppliers';
import PurchaseOrders from './pages/admin/PurchaseOrders';
import Coupons from './pages/admin/Coupons';
import Reports from './pages/admin/Reports';
import BillingScreen from './pages/cashier/BillingScreen';
import HoldSales from './pages/cashier/HoldSales';
import Returns from './pages/cashier/Returns';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/products" element={<Products />} />
          <Route path="/admin/inventory" element={<Inventory />} />
          <Route path="/admin/suppliers" element={<Suppliers />} />
          <Route path="/admin/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/admin/coupons" element={<Coupons />} />
          <Route path="/admin/customers" element={<Customers />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/settings" element={<Settings />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['cashier']} />}>
          <Route path="/cashier" element={<BillingScreen />} />
          <Route path="/cashier/customers" element={<Customers />} />
          <Route path="/cashier/held-sales" element={<HoldSales />} />
          <Route path="/cashier/returns" element={<Returns />} />
          <Route path="/cashier/settings" element={<Settings />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
