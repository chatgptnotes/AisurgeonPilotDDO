
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { AppSidebarProps } from './sidebar/types';
import { useMenuItems } from './sidebar/useMenuItems';
import { SidebarMenuItem } from './sidebar/SidebarMenuItem';
import { SidebarHeaderComponent } from './sidebar/SidebarHeaderComponent';
import { aiFeatures } from './sidebar/menuItems';
import { Sparkles } from 'lucide-react';

export function AppSidebar(props: AppSidebarProps) {
  const menuItems = useMenuItems(props);

  return (
    <Sidebar>
      <SidebarHeaderComponent />
      <SidebarContent>
        {/* AI Features Section - Prominently displayed at top */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 mb-2 flex items-center gap-2 text-blue-600 font-semibold">
            <Sparkles className="w-4 h-4" />
            AI Surgeon Pilot Features
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aiFeatures.map((item) => (
                <SidebarMenuItem key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Regular Menu Items */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 mb-2">Hospital Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
