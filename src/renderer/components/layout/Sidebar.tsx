import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  ShoppingCartIcon, 
  CubeIcon, 
  BanknotesIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { preloadData } from '../../src/hooks/useDataCache';

interface NavItem {
  name: string;
  href: string;
  icon: (props: React.ComponentProps<'svg'>) => JSX.Element;
  roles: string[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['admin', 'sales', 'inventory', 'finance'] },
  { name: 'Sales', href: '/sales', icon: ShoppingCartIcon, roles: ['admin', 'sales'] },
  { name: 'Inventory', href: '/inventory', icon: CubeIcon, roles: ['admin', 'inventory'] },
  { name: 'Finance', href: '/finance', icon: BanknotesIcon, roles: ['admin', 'finance'] },
  { name: 'Profile', href: '/profile', icon: UserIcon, roles: ['admin', 'sales', 'inventory', 'finance'] },
];

interface SidebarProps {
  userRole: string;
}

export default function Sidebar({ userRole }: SidebarProps) {
  const location = useLocation();

  return (
    <div className="flex h-screen flex-col justify-between border-r bg-white">
      <div className="px-4 py-6">
        <span className="grid h-10 w-32 place-content-center rounded-lg bg-gray-100 text-xs text-gray-600">
          Sales Electron
        </span>

        <ul className="mt-6 space-y-1">
          {navigation
            .filter(item => item.roles.includes(userRole))
            .map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`group flex items-center rounded-lg px-4 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-gray-100 text-gray-700'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                    to={item.href}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${
                        isActive ? 'text-gray-700' : 'text-gray-500'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                </li>
              );
          })}
        </ul>
      </div>

      <div className="sticky inset-x-0 bottom-0 border-t border-gray-100">
        <div className="flex items-center gap-2 bg-white p-4 hover:bg-gray-50">
          <div>
            <p className="text-xs">
              <strong className="block font-medium">Role: {userRole}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}