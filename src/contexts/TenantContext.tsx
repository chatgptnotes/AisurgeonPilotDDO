import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  display_name: string;
  contact_email: string;
  primary_color: string;
  settings: TenantSettings;
  is_active: boolean;
  created_at: string;
}

export interface TenantSettings {
  features: {
    pharmacy: boolean;
    lab: boolean;
    radiology: boolean;
    ot: boolean;
    patient_portal: boolean;
    online_appointments: boolean;
    online_consultations: boolean;
    whatsapp_notifications: boolean;
    email_notifications: boolean;
  };
  business_hours?: Record<string, { open: string; close: string }>;
  appointment_duration?: number;
  currency?: string;
  timezone?: string;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: string;
  is_primary: boolean;
  created_at: string;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  userTenants: Tenant[];
  tenantUsers: TenantUser[];
  isLoadingTenant: boolean;
  switchTenant: (tenantId: string) => Promise<void>;
  refreshTenant: () => Promise<void>;
  hasFeature: (feature: keyof TenantSettings['features']) => boolean;
  isSuperadmin: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider = ({ children }: TenantProviderProps) => {
  const { user, isAuthenticated } = useAuth();
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [userTenants, setUserTenants] = useState<Tenant[]>([]);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [isLoadingTenant, setIsLoadingTenant] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  // Load user's tenants and current tenant
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setCurrentTenant(null);
      setUserTenants([]);
      setTenantUsers([]);
      setIsLoadingTenant(false);
      setIsSuperadmin(false);
      return;
    }

    loadUserTenants();
  }, [isAuthenticated, user?.id]);

  const loadUserTenants = async () => {
    try {
      setIsLoadingTenant(true);

      // Check if user is superadmin by role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user!.id)
        .single();

      if (!userError && userData?.role === 'superadmin') {
        setIsSuperadmin(true);
        // Superadmin can see all tenants
        await loadAllTenants();
        return;
      }

      // Use auth user ID directly for tenant lookups
      const userId = user!.id;

      if (!userId) {
        console.warn('User ID not found');
        setIsLoadingTenant(false);
        return;
      }

      // Load user's tenant memberships
      const { data: memberships, error: membershipError} = await supabase
        .from('tenant_users')
        .select(`
          id,
          tenant_id,
          user_id,
          role,
          is_primary,
          created_at,
          tenants (
            id,
            name,
            slug,
            display_name,
            contact_email,
            primary_color,
            settings,
            is_active,
            created_at
          )
        `)
        .eq('user_id', userId);

      if (membershipError) {
        console.error('Error loading tenant memberships:', membershipError);
        setIsLoadingTenant(false);
        return;
      }

      if (!memberships || memberships.length === 0) {
        console.warn('User has no tenant memberships');
        setIsLoadingTenant(false);
        return;
      }

      // Extract tenants and tenant_users
      const tenants = memberships
        .map((m: any) => m.tenants)
        .filter(Boolean) as Tenant[];

      const tenantUsersList = memberships.map((m: any) => ({
        id: m.id,
        tenant_id: m.tenant_id,
        user_id: m.user_id,
        role: m.role,
        is_primary: m.is_primary,
        created_at: m.created_at
      })) as TenantUser[];

      setUserTenants(tenants);
      setTenantUsers(tenantUsersList);

      // Set current tenant from localStorage or primary tenant
      const savedTenantId = localStorage.getItem('current_tenant_id');
      let current: Tenant | null = null;

      if (savedTenantId) {
        current = tenants.find(t => t.id === savedTenantId) || null;
      }

      if (!current) {
        // Find primary tenant
        const primaryMembership = memberships.find((m: any) => m.is_primary);
        current = primaryMembership?.tenants || tenants[0];
      }

      setCurrentTenant(current);
      if (current) {
        localStorage.setItem('current_tenant_id', current.id);
      }

      setIsLoadingTenant(false);
    } catch (error) {
      console.error('Error loading tenants:', error);
      setIsLoadingTenant(false);
    }
  };

  const loadAllTenants = async () => {
    try {
      const { data: tenants, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error loading all tenants:', error);
        return;
      }

      setUserTenants(tenants as Tenant[]);

      // Set current tenant from localStorage or first tenant
      const savedTenantId = localStorage.getItem('current_tenant_id');
      let current = tenants.find(t => t.id === savedTenantId) || tenants[0];

      setCurrentTenant(current as Tenant);
      if (current) {
        localStorage.setItem('current_tenant_id', current.id);
      }

      setIsLoadingTenant(false);
    } catch (error) {
      console.error('Error loading all tenants:', error);
      setIsLoadingTenant(false);
    }
  };

  const switchTenant = async (tenantId: string) => {
    const tenant = userTenants.find(t => t.id === tenantId);
    if (!tenant) {
      console.error('Tenant not found in user tenants');
      return;
    }

    setCurrentTenant(tenant);
    localStorage.setItem('current_tenant_id', tenantId);

    // Refresh the page to reload data for new tenant
    window.location.reload();
  };

  const refreshTenant = async () => {
    await loadUserTenants();
  };

  const hasFeature = (feature: keyof TenantSettings['features']): boolean => {
    if (!currentTenant) return false;
    return currentTenant.settings?.features?.[feature] || false;
  };

  const value: TenantContextType = {
    currentTenant,
    userTenants,
    tenantUsers,
    isLoadingTenant,
    switchTenant,
    refreshTenant,
    hasFeature,
    isSuperadmin
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};
