import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { RoleProvider } from './hooks/useRole';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CitizenDashboard from './pages/CitizenDashboard';
import GuardianDashboard from './pages/GuardianDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AlertDetail from './pages/AlertDetail';
import GuardianApplication from './pages/GuardianApplication';
import TrustedContacts from './pages/TrustedContacts';
import Settings from './pages/Settings';
import AgencySubscriptionScreen from './pages/AgencySubscriptionScreen';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/subscribe" element={<AgencySubscriptionScreen />} />
            <Route path="/" element={<Navigate to="/citizen" />} />
            <Route element={<Layout />}>
              <Route path="/citizen" element={<CitizenDashboard />} />
              <Route
                path="/guardian"
                element={
                  <ProtectedRoute requiredRole="guardian">
                    <GuardianDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/alert/:id" element={<AlertDetail />} />
              <Route
                path="/guardian/apply"
                element={
                  <ProtectedRoute requiredRole="citizen">
                    <GuardianApplication />
                  </ProtectedRoute>
                }
              />
              <Route path="/contacts" element={<TrustedContacts />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/citizen" />} />
          </Routes>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#fff',
                padding: '16px 24px',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
              },
              success: { style: { background: '#10b981' } },
              error: { style: { background: '#d32f2f' } },
              loading: { style: { background: '#3b82f6' } },
            }}
          />
        </BrowserRouter>
      </RoleProvider>
    </AuthProvider>
  );
}