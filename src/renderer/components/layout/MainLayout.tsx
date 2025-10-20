import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../src/contexts/AuthContext';

interface SidebarItem {
  name: string;
  path: string;
  icon: string;
  roles: string[];
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊', roles: ['admin', 'sales', 'inventory', 'finance'] },
  { name: 'Sales', path: '/sales', icon: '💰', roles: ['admin', 'sales'] },
  { name: 'Inventory', path: '/inventory', icon: '📦', roles: ['admin', 'inventory'] },
  { name: 'Finance', path: '/finance', icon: '💵', roles: ['admin', 'finance'] },
];

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth();

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center justify-center border-b">
          <h1 className="text-xl font-bold text-gray-800">Sales Manager</h1>
        </div>
        <nav className="mt-6">
          {sidebarItems
            .filter((item) => item.roles.includes(user.role))
            .map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`mx-4 my-2 flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{user.username}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
            <button
              onClick={() => logout()}
              className="rounded bg-red-50 px-3 py-1 text-sm text-red-600 hover:bg-red-100"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
};

export default MainLayout;