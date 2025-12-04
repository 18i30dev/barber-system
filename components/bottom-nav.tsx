'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, UserX, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Início' },
  { href: '/clients', icon: Users, label: 'Clientes' },
  { href: '/reengagement', icon: UserX, label: 'Reengajar' },
  { href: '/settings', icon: Settings, label: 'Config' }
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-gold/20 z-50">
      <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto px-4">
        {navItems?.map((item) => {
          const Icon = item?.icon;
          const isActive = pathname === item?.href;
          return (
            <Link
              key={item?.href}
              href={item?.href || '/'}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'text-gold'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {Icon && <Icon className="w-5 h-5" />}
              <span className="text-xs font-medium">{item?.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
