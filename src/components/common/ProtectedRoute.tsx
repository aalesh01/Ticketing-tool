import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useTypedSelector(state => state.auth);

  console.log('Debug - Current user:', user);
  console.log('Debug - Allowed roles:', allowedRoles);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Only check roles if allowedRoles is provided and not empty
  if (allowedRoles?.length && user) {
    const hasAllowedRole = allowedRoles.includes(user.role);
    console.log('Debug - Has allowed role:', hasAllowedRole);
    
    if (!hasAllowedRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};
