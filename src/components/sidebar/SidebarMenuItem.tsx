
import { useNavigate, useLocation } from 'react-router-dom';
import { SidebarMenuButton, SidebarMenuItem as SidebarMenuItemBase } from '@/components/ui/sidebar';
import { MenuItem } from './types';

interface SidebarMenuItemProps {
  item: MenuItem;
}

export const SidebarMenuItem = ({ item }: SidebarMenuItemProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleItemClick = (route: string, event: React.MouseEvent) => {
    event.preventDefault(); // Always prevent default to avoid full page reload

    // Check if Ctrl (Windows/Linux) or Cmd (Mac) is held
    if (event.ctrlKey || event.metaKey) {
      // Open in new tab with keyboard modifier
      window.open(route, '_blank');
    } else {
      // Default: Navigate in the same tab using React Router
      navigate(route);
    }
  };

  return (
    <SidebarMenuItemBase key={item.title}>
      <SidebarMenuButton asChild>
        <button
          className={`flex items-center justify-between w-full ${
            location.pathname === item.route ? 'bg-accent' : ''
          }`}
          onClick={(e) => handleItemClick(item.route, e)}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-medium text-sm truncate">{item.title}</span>
              <span className="text-xs text-muted-foreground truncate">
                {item.description}
              </span>
            </div>
          </div>
          <div className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 min-w-[2rem] text-center">
            {item.count}
          </div>
        </button>
      </SidebarMenuButton>
    </SidebarMenuItemBase>
  );
};
