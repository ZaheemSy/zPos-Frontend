import { useEffect, useState } from 'react';
import { apiClient } from './api/client';
import './App.css';

function App() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'ok' | 'down'>('checking');

  useEffect(() => {
    apiClient
      .get('/health')
      .then(() => setBackendStatus('ok'))
      .catch(() => setBackendStatus('down'));
  }, []);

  return (
    <section id="center">
      <h1>zPos</h1>
      <p>Backend status: {backendStatus}</p>
    </section>
  );
}

export default App;
