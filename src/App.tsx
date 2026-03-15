// App.tsx
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AuthProvider } from "./context/AuthContext";
import { ClientDataProvider } from "./context/ClientDataContext";
import RenderRouter from "./routes/RenderRouter";

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/ping`) // backend ping
      .then(response => setMessage(response.data.message))
      .catch(error => console.error('Error connecting:', error));
  }, []);

  return (
    <AuthProvider>
      <ClientDataProvider>
        <div style={{ textAlign: 'center', marginTop: '5rem' }}>
          <h1>React ↔ Laravel Connection Test</h1>
          <p>{message || 'Connecting...'}</p>
        </div>
        <RenderRouter />
      </ClientDataProvider>
    </AuthProvider>
  );
}

export default App;