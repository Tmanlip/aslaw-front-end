// App.tsx
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { AuthProvider } from "./context/AuthContext";
import { ClientDataProvider } from "./context/ClientDataContext";
import RenderRouter from "./routes/RenderRouter";

function App() {
  return (
    <AuthProvider>
      <ClientDataProvider>
        <RenderRouter />
      </ClientDataProvider>
    </AuthProvider>
  );
}

export default App;