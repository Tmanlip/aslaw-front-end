import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';

// Hook to get authentication status and user role
const useAuth = () => {
  // Get user data from localStorage (replace with your actual auth logic)
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAuthenticated = !!user.token;
  const userRole = user.role; // 'admin', 'client', 'lawyer'
  
  return { isAuthenticated, userRole, user };
};

type ProtectedRouteProps = {
  children?: React.ReactNode;
  allowedRoles?: string[];
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { isAuthenticated, userRole } = useAuth();
  const location = useLocation();

  // If not authenticated, redirect to home page (which has login)
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If specific roles are required and user doesn't have permission
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If children are provided, render them; otherwise render Outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;