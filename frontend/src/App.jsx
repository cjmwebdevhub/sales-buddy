import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Activities from './pages/Activities';
import ActivityCalendar from './pages/ActivityCalendar';
import Targets from './pages/Targets';
import TargetShares from './pages/TargetShares';
import DailyLR from './pages/DailyLR';
import Uploads from './pages/Uploads';
import Promos from './pages/Promos';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Assign from './pages/Assign';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="activities" element={<Activities />} />
            <Route path="calendar" element={<ActivityCalendar />} />
            <Route path="targets" element={<Targets />} />
            <Route path="target-shares" element={<TargetShares />} />
            <Route path="daily-lr" element={<DailyLR />} />
            <Route path="uploads" element={<Uploads />} />
            <Route path="promos" element={<Promos />} />
            <Route path="users" element={<Users />} />
            <Route path="assign" element={<Assign />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </BrowserRouter>
    </AuthProvider>
  );
}
