'use client';

import { LogOut, Scissors } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function Header() {
  const { data: session } = useSession() || {};

  return (
    <header className="sticky top-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-b border-gold/20 z-40">
      <div className="flex justify-between items-center h-16 max-w-screen-xl mx-auto px-4">
        <div className="flex items-center gap-2">
          <Scissors className="w-6 h-6 text-gold" />
          <h1 className="text-xl font-bold text-white">
            Barber <span className="text-gold">Manager</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 hidden sm:inline">
            {session?.user?.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-gray-400 hover:text-white hover:bg-gold/10"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
