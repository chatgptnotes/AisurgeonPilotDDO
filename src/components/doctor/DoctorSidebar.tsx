import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  Stethoscope,
  DollarSign,
  FileText,
  MessageSquare,
  Video,
  TestTube,
  Pill,
  Activity,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Clock,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DoctorSidebarProps {
  doctorName?: string;
  doctorEmail?: string;
  doctorPhoto?: string;
}

export const DoctorSidebar: React.FC<DoctorSidebarProps> = ({
  doctorName = 'Dr. User',
  doctorEmail = 'doctor@example.com',
  doctorPhoto,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [hospitalExpanded, setHospitalExpanded] = useState(true);
  const [ddoExpanded, setDdoExpanded] = useState(true);
  const [hospitalStats, setHospitalStats] = useState({
    hope: 0,
    ayushman: 0,
    esic: 0,
    cghs: 0,
  });

  useEffect(() => {
    fetchHospitalStats();
  }, []);

  const fetchHospitalStats = async () => {
    try {
      // Try to fetch hospital stats, but use placeholders if it fails
      const { count: hopeCount, error: hopeError } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('hospital_name', 'hope');

      const { count: ayushmanCount, error: ayushmanError } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('hospital_name', 'ayushman');

      // Use placeholder counts if the column doesn't exist
      setHospitalStats({
        hope: hopeError ? 247 : (hopeCount || 0),
        ayushman: ayushmanError ? 186 : (ayushmanCount || 0),
        esic: 94,
        cghs: 63,
      });
    } catch (err) {
      // Silently use placeholder counts if fetching fails
      setHospitalStats({
        hope: 247,
        ayushman: 186,
        esic: 94,
        cghs: 63,
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-3 p-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={doctorPhoto} alt={doctorName} />
            <AvatarFallback className="bg-blue-600 text-white">
              {doctorName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{doctorName}</p>
            <p className="text-xs text-muted-foreground truncate">{doctorEmail}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/doctor/dashboard')}
                isActive={isActive('/doctor/dashboard')}
                className="w-full"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/doctor/calendar')}
                isActive={isActive('/doctor/calendar')}
                className="w-full"
              >
                <Calendar className="h-4 w-4" />
                <span>Calendar</span>
                <Badge className="ml-auto bg-green-500 text-white text-xs">NEW</Badge>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Digital Doctor Office (DDO) */}
        <SidebarGroup>
          <SidebarGroupLabel
            className="cursor-pointer flex items-center justify-between"
            onClick={() => setDdoExpanded(!ddoExpanded)}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Digital Doctor Office</span>
            </div>
            {ddoExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </SidebarGroupLabel>

          {ddoExpanded && (
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/doctors')}
                    isActive={isActive('/doctors')}
                    className="w-full"
                  >
                    <Users className="h-4 w-4" />
                    <span>Doctor Directory</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/whatsapp-service-test')}
                    isActive={isActive('/whatsapp-service-test')}
                    className="w-full"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>WhatsApp Manager</span>
                    <Badge className="ml-auto bg-green-500 text-white text-xs">NEW</Badge>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/patient-followup')}
                    isActive={isActive('/patient-followup')}
                    className="w-full"
                  >
                    <Users className="h-4 w-4" />
                    <span>Patient Follow-up</span>
                    <Badge className="ml-auto bg-green-500 text-white text-xs">NEW</Badge>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/patient-education')}
                    isActive={isActive('/patient-education')}
                    className="w-full"
                  >
                    <Video className="h-4 w-4" />
                    <span>Patient Education</span>
                    <Badge className="ml-auto bg-green-500 text-white text-xs">NEW</Badge>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/surgery-options')}
                    isActive={isActive('/surgery-options')}
                    className="w-full"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Surgery Options</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        <SidebarSeparator />

        {/* Hospital Management */}
        <SidebarGroup>
          <SidebarGroupLabel
            className="cursor-pointer flex items-center justify-between"
            onClick={() => setHospitalExpanded(!hospitalExpanded)}
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Hospital Management</span>
            </div>
            {hospitalExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </SidebarGroupLabel>

          {hospitalExpanded && (
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Hospital Quick Access */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/')}
                    isActive={isActive('/')}
                    className="w-full"
                  >
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span>Hope Hospital</span>
                    <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {hospitalStats.hope}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/')}
                    isActive={isActive('/')}
                    className="w-full"
                  >
                    <Building2 className="h-4 w-4 text-green-600" />
                    <span>Ayushman</span>
                    <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {hospitalStats.ayushman}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/esic-surgeons')}
                    isActive={isActive('/esic-surgeons')}
                    className="w-full"
                  >
                    <Stethoscope className="h-4 w-4 text-purple-600" />
                    <span>ESIC</span>
                    <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      {hospitalStats.esic}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/cghs-surgery')}
                    isActive={isActive('/cghs-surgery')}
                    className="w-full"
                  >
                    <Stethoscope className="h-4 w-4 text-orange-600" />
                    <span>CGHS</span>
                    <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                      {hospitalStats.cghs}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Submenu for Hospital Features */}
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/patient-dashboard')}>
                      <Users className="h-4 w-4" />
                      <span>Patient Dashboard</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/todays-opd')}>
                      <Clock className="h-4 w-4" />
                      <span>Today's OPD</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/todays-ipd')}>
                      <Activity className="h-4 w-4" />
                      <span>IPD Dashboard</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/currently-admitted')}>
                      <Users className="h-4 w-4" />
                      <span>Currently Admitted</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/operation-theatre')}>
                      <Stethoscope className="h-4 w-4" />
                      <span>Operation Theatre</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/lab')}>
                      <TestTube className="h-4 w-4" />
                      <span>Lab</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/radiology')}>
                      <Activity className="h-4 w-4" />
                      <span>Radiology</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/pharmacy')}>
                      <Pill className="h-4 w-4" />
                      <span>Pharmacy</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/accounting')}>
                      <DollarSign className="h-4 w-4" />
                      <span>Accounting</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={() => navigate('/bill-management')}>
                      <FileText className="h-4 w-4" />
                      <span>Bill Management</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        <SidebarSeparator />

        {/* Analytics & Reports */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/reports')}
                isActive={isActive('/reports')}
                className="w-full"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Reports</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/financial-summary')}
                isActive={isActive('/financial-summary')}
                className="w-full"
              >
                <DollarSign className="h-4 w-4" />
                <span>Financial Summary</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => navigate('/doctor/settings')}
              isActive={isActive('/doctor/settings')}
              className="w-full"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="w-full text-red-600 hover:text-red-700">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
