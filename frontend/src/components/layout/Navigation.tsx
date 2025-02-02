'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  Square3Stack3DIcon as DatabaseIcon, 
  KeyIcon, 
  ChartBarIcon 
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Your Databases', href: '/datasets', icon: DatabaseIcon },
  { name: 'API Keys', href: '/api-keys', icon: KeyIcon },
  { name: 'Usage', href: '/usage', icon: ChartBarIcon },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
              ${isActive
                ? 'bg-primary/10 text-primary'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }
            `}
          >
            <item.icon 
              className={`
                mr-3 h-5 w-5 transition-colors
                ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'}
              `} 
            />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
