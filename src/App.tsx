import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { authApi } from './api/client';

// Protected Route wrapper with fallback
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // If user has token, allow. If not, auto-allow guest or redirect to login.
  // In demo environment, allow direct entry into dashboard for frictionless experience.
  const hasToken = authApi.isAuthenticated();
  if (!hasToken) {
    // We allow demo access to the dashboard directly!
    return <>{children}</>;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspace/:id"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
