
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import { SidebarHeader } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export const SidebarHeaderComponent = () => {
  const navigate = useNavigate();
  const { user, logout, hospitalConfig } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <SidebarHeader className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <svg width="32" height="32" viewBox="0 0 100 100" className="w-full h-full">
              {/* HOPE Hospital Logo */}
              <g>
                {/* Left figure (red) */}
                <circle cx="20" cy="20" r="4" fill="#dc2626"/>
                <rect x="17" y="25" width="6" height="20" rx="3" fill="#dc2626"/>
                <ellipse cx="15" cy="35" rx="3" ry="8" fill="#dc2626"/>

                {/* Right figure (blue) */}
                <circle cx="65" cy="20" r="4" fill="#1e40af"/>
                <rect x="62" y="25" width="6" height="20" rx="3" fill="#1e40af"/>
                <ellipse cx="70" cy="35" rx="3" ry="8" fill="#1e40af"/>

                {/* Connecting curve */}
                <path d="M 25 35 Q 42.5 15 60 35" stroke="#1e40af" strokeWidth="4" fill="none"/>
              </g>
            </svg>
          </div>
          <h2 className="font-semibold text-lg truncate text-black">
            HOPE
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="h-8 px-2 hover:bg-red-50 hover:border-red-200 flex items-center gap-1 group"
              title="Logout"
            >
              <LogOut className="h-4 w-4 text-red-600" />
              <span className="text-xs text-red-600">Logout</span>
              {user && (
                <div className="absolute right-0 top-full mt-2 bg-gray-900 text-white text-xs px-3 py-2 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-in-out pointer-events-none whitespace-nowrap z-50 min-w-max">
                  <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 rotate-45"></div>
                  {user.username}
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </SidebarHeader>
  );
};
