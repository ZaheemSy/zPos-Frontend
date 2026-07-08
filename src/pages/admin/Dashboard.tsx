import { useNavigate } from 'react-router-dom';
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
      <button onClick={handleLogout}>Logout</button>
    </section>
  );
}
