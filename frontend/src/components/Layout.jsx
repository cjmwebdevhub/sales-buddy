import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard', roles: ['SA','ASH','RSH','SH','Admin'] },
  { to: '/customers', icon: '👥', label: 'Customers', roles: ['SA','ASH','RSH','SH','Admin'] },
  { to: '/activities', icon: '📋', label: 'Activities', roles: ['SA','ASH','RSH','SH','Admin'] },
  { to: '/calendar', icon: '📅', label: 'Calendar', roles: ['SA','ASH','RSH','SH','Admin'] },
  { to: '/targets', icon: '🎯', label: 'Targets', roles: ['SA','ASH','RSH','SH','Admin'] },
  { to: '/target-shares', icon: '📈', label: 'Target Shares', roles: ['ASH','RSH','SH','Admin'] },
  { to: '/daily-lr', icon: '💰', label: 'Daily LR', roles: ['ASH','RSH','SH','Admin'] },
  { to: '/assign', icon: '🔀', label: 'Assign Leads', roles: ['ASH','RSH','SH','Admin'] },
  { to: '/uploads', icon: '📤', label: 'Uploads', roles: ['Admin'] },
  { to: '/promos', icon: '🎁', label: 'Promos', roles: ['SA','ASH','RSH','SH','Admin'] },
  { to: '/users', icon: '👤', label: 'Users', roles: ['ASH','RSH','SH','Admin'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleNav = navItems.filter(n => n.roles.includes(user?.role));

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} bg-slate-900 flex flex-col transition-all duration-200 flex-shrink-0`}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
          <span className="text-2xl">💼</span>
          {sidebarOpen && <span className="text-white font-bold text-lg">Sales Buddy 3.0</span>}
        </div>
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
          {visibleNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''} mb-2`}>
            <span className="text-lg">⚙️</span>
            {sidebarOpen && <span>Profile</span>}
          </NavLink>
          <button onClick={handleLogout} className="sidebar-link w-full text-left">
            <span className="text-lg">🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 hover:text-slate-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-800">{user?.full_name}</div>
              <div className="text-xs text-slate-500">{user?.role} · {user?.agency}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
