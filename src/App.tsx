//import HomePage from './pages/Home';
//import NewHome from './pages/newHome';
//import RegisterPage from './pages/Admin/Manage User/Register';
//import ForgotPasswordPage from './pages/ForgotPassword';
//import MFAEmailForm from './pages/ForgotPassword/MFA';
//import MyProfile from './pages/Client/My Profile';
//import ResetPassword from './pages/Client/My Profile/ResetPassword';
//import ManageUser from './pages/Admin/Manage User/Manage';
//import ManageProfile from './pages/Admin/Manage User/Manage/Manage Profile';
//import DisplayCase from './pages/Admin/Manage Case/Display Case';
import 'bootstrap/dist/css/bootstrap.min.css';
//import UpdateCheque from './pages/Admin/Billing';
import { AuthProvider } from "./context/AuthContext";
import RenderRouter from "./routes/RenderRouter";
import axios from 'axios';
import React, { useEffect, useState } from 'react';
//http://127.0.0.1:8000/api/ping aslaw-back-end-emeyfvfcarepa8dj.southeastasia-01.azurewebsites.net

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/ping`) // update with your backend URL
      .then(response => setMessage(response.data.message))
      .catch(error => console.error('Error connecting:', error));
  }, []);

  return (
    
    <AuthProvider>
      <div style={{ textAlign: 'center', marginTop: '5rem' }}>
        <h1>React ↔ Laravel Connection Test</h1>  
        <p>{message || 'Connecting...'}</p>
      </div>
      <RenderRouter />
    </AuthProvider>
  )
}

export default App;
