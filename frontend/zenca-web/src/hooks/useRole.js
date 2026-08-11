import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../services/supabase';

const RoleContext = createContext();

const ROLES = ['citizen', 'guardian', 'admin'];
const DEFAULT_ROLE = 'citizen';

export const RoleProvider = ({ children }) => {
  const { user } = useAuth();
  const [role, setRole] = useState(DEFAULT_ROLE);
  const [availableRoles, setAvailableRoles] = useState([DEFAULT_ROLE]);

  useEffect(() => {
    if (!user) {
      setRole(DEFAULT_ROLE);
      setAvailableRoles([DEFAULT_ROLE]);
      return;
    }

    const fetchRoles = async () => {
      const roles = [DEFAULT_ROLE];

      // Check if user is a verified guardian
      const { data: guardian, error: gError } = await supabase
        .from('guardians')
        .select('is_verified')
        .eq('device_uuid', user.id) // In web we use user.id as device_uuid? We'll handle later.
        .single();
      if (!gError && guardian?.is_verified) {
        roles.push('guardian');
      }

      // Check if user is an admin (agency)
      const { data: agency, error: aError } = await supabase
        .from('agencies')
        .select('subscription_status')
        .eq('email', user.email)
        .single();
      if (!aError && agency?.subscription_status === 'active') {
        roles.push('admin');
      }

      setAvailableRoles(roles);
      // If current role is not available, reset to default
      if (!roles.includes(role)) {
        setRole(DEFAULT_ROLE);
      }
    };

    fetchRoles();
  }, [user]);

  const switchRole = (newRole) => {
    if (availableRoles.includes(newRole)) {
      setRole(newRole);
    }
  };

  return (
    <RoleContext.Provider value={{ role, setRole: switchRole, availableRoles }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) throw new Error('useRole must be used within a RoleProvider');
  return context;
};