/**
 * User-to-Employee Mapping
 *
 * This file maps Auth0 user IDs to employee records in the payroll system.
 * Used for Fine-Grained Authorization (FGA) to determine what data a user can access.
 */

export interface UserEmployeeMapping {
  auth0UserId: string;
  employeeId: string;
  name: string;
  department: string;
  roles: string[];
}

/**
 * Map Auth0 users to employee records
 *
 * For FGA Phase 3, we'll use this to:
 * - Check if user can view their own payroll data
 * - Determine if user has manager permissions to view others' data
 * - Control access to sensitive financial operations
 */
export const userEmployeeMappings: UserEmployeeMapping[] = [
  {
    // Demo user: Morty Smith (your vibec0derzz Auth0 account)
    auth0UserId: 'auth0|REPLACE_WITH_YOUR_ACTUAL_USER_ID', // Get this from "Who am I?" query
    employeeId: 'EMP006',
    name: 'Morty Smith',
    department: 'Finance',
    roles: ['employee', 'finance_viewer'],
  },
  {
    // Alice Johnson - Treasury Manager
    auth0UserId: 'auth0|alice_demo',
    employeeId: 'EMP001',
    name: 'Alice Johnson',
    department: 'Treasury',
    roles: ['employee', 'treasury_manager', 'payroll_admin'],
  },
  {
    // Bob Smith - Treasury
    auth0UserId: 'auth0|bob_demo',
    employeeId: 'EMP002',
    name: 'Bob Smith',
    department: 'Treasury',
    roles: ['employee', 'treasury_viewer'],
  },
];

/**
 * Get employee ID from Auth0 user ID
 */
export function getEmployeeIdFromAuth0(auth0UserId: string): string | null {
  const mapping = userEmployeeMappings.find((m) => m.auth0UserId === auth0UserId);
  return mapping?.employeeId || null;
}

/**
 * Get user roles from Auth0 user ID
 */
export function getUserRoles(auth0UserId: string): string[] {
  const mapping = userEmployeeMappings.find((m) => m.auth0UserId === auth0UserId);
  return mapping?.roles || [];
}

/**
 * Check if user can access specific employee's payroll data
 *
 * Rules:
 * - Users can always view their own data
 * - payroll_admin can view all data
 * - treasury_manager can view treasury department data
 */
export function canAccessPayrollData(
  auth0UserId: string,
  targetEmployeeId: string
): boolean {
  const userMapping = userEmployeeMappings.find((m) => m.auth0UserId === auth0UserId);

  if (!userMapping) {
    return false; // User not in system
  }

  // Can always access own data
  if (userMapping.employeeId === targetEmployeeId) {
    return true;
  }

  // Admins can access all data
  if (userMapping.roles.includes('payroll_admin')) {
    return true;
  }

  // Managers can access their department's data
  if (userMapping.roles.includes('treasury_manager')) {
    const targetMapping = userEmployeeMappings.find((m) => m.employeeId === targetEmployeeId);
    if (targetMapping?.department === 'Treasury') {
      return true;
    }
  }

  return false;
}
