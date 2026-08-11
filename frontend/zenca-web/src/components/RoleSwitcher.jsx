import React from 'react';
import { useRole } from '../hooks/useRole';
import { useAuth } from '../hooks/useAuth';

export default function RoleSwitcher() {
  const { role, setRole, availableRoles } = useRole();
  const { user } = useAuth();

  // Only show if user is logged in and has multiple roles
  if (!user || availableRoles.length <= 1) return null;

  const handleChange = (e) => {
    const newRole = e.target.value;
    setRole(newRole);
    // Optionally navigate to the corresponding dashboard
    window.location.href = `/${newRole}`;
  };

  return (
    <select
      value={role}
      onChange={handleChange}
      className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
    >
      {availableRoles.map((r) => (
        <option key={r} value={r}>
          {r.charAt(0).toUpperCase() + r.slice(1)}
        </option>
      ))}
    </select>
  );
}