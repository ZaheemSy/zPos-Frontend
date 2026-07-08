import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';

export default function BillingScreen() {
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
      <h1>Billing Screen</h1>
      <p>Welcome, {user?.name}. Branch: {user?.branchId}</p>
      <nav style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <Link to="/cashier/customers">Customers</Link>
      </nav>
      <button onClick={handleLogout}>Logout</button>
    </section>
  );
}
