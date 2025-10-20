import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

interface User {
  username: string;
  role: string;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr && location.pathname !== '/login') {
      navigate('/login')
      return;
    }
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, [router]);

  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', roles: ['admin', 'sales', 'inventory', 'finance'] },
    { name: 'Sales', href: '/sales', roles: ['admin', 'sales'] },
    { name: 'Inventory', href: '/inventory', roles: ['admin', 'inventory'] },
    { name: 'Finance', href: '/finance', roles: ['admin', 'finance'] },
  ];

  const allowedLinks = navigation.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {allowedLinks.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-4 text-sm font-medium ${
                    location.pathname === item.href
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="flex items-center">
              {user && (
                <span className="text-sm text-gray-500">
                  {user.username} ({user.role})
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}