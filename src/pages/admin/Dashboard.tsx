import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  async function handleLogout() {
    await logout();
    clearSession();
    navigate('/login');
  }

  return (
    <section style={{ maxWidth: 480, margin: '80px auto' }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user?.name}.</p>
      <nav style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <Link to="/admin/products">Products</Link>
        <Link to="/admin/inventory">Inventory</Link>
        <Link to="/admin/suppliers">Suppliers</Link>
        <Link to="/admin/purchase-orders">Purchase Orders</Link>
        <Link to="/admin/customers">Customers</Link>
        <Link to="/admin/coupons">Coupons</Link>
      </nav>
      <button onClick={handleLogout}>Logout</button>
    </section>
  );
}
