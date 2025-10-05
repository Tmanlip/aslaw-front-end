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

function App() {
  /*const [role, setRole] = useState<"admin" | "client" | "lawyer" | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLoginSuccess = (
      userRole: "admin" | "client" | "lawyer",
      message: string
    ) => {
      setRole(userRole);
      setSuccessMessage(message);
    };

  // Show dashboard based on role
    if (!role) {
    return <HomePage onLoginSuccess={handleLoginSuccess} />;
  }

  if (role === "admin") {
    return <AdminDashboard successMessage={successMessage ?? ""} />;
  }
  if (role === "client") {
    return <ClientDashboard successMessage={successMessage ?? ""} />;
  }
  if (role === "lawyer") {
    return <LawyerDashboard successMessage={successMessage ?? ""} />;
  }

  return null;

  // return <div className="App"><AuthProvider>{renderDashboard()}</AuthProvider></div>; */

  //return <Chatbot /> 
  return (
    <AuthProvider>
      <RenderRouter />
    </AuthProvider>
  )
}

export default App;
