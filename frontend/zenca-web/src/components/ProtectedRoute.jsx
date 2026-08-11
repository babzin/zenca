import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  const { role } = useRole();

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // Redirect to citizen dashboard if they don't have the required role
    return <Navigate to="/citizen" replace />;
  }

  return children;
}