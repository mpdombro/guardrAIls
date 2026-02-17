import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { getPayrollByYear } from '../../data/treasury.js';
import { fgaClient } from '../../fga/fgaClient.js';
import type { SecurityFeatures } from '../../../types/index.js';

/**
 * Security context for tool execution
 */
export interface ToolSecurityContext {
  securityFeatures: SecurityFeatures;
  userAuthenticated: boolean;
  userId?: string;
}

/**
 * Factory function to create viewPayroll tool with security context
 */
export function createViewPayrollTool(context: ToolSecurityContext) {
  return new DynamicStructuredTool({
    name: 'view_payroll',
    description:
      'View payroll information for a specific year. This contains sensitive employee salary data. Use this when the user asks to see payroll, salary information, or employee compensation data.',
    schema: z.object({
      year: z.number().describe('The year to retrieve payroll data for (e.g., 2023, 2024)'),
    }),
    func: async ({ year }) => {
      const payroll = getPayrollByYear(year);

      if (!payroll) {
        return JSON.stringify({
          success: false,
          error: `No payroll data found for year ${year}`,
        });
      }

      // If FGA is enabled, filter records based on permissions
      let filteredRecords = payroll.records;
      const fgaChecks: Array<{
        employeeId: string;
        allowed: boolean;
      }> = [];

      if (context.securityFeatures.fgaEnabled && context.userId) {
        console.log('[FGA] Checking payroll access permissions...');

        // Check each employee record
        const permissionChecks = await Promise.all(
          payroll.records.map(async (record) => {
            const allowed = await fgaClient.canViewPayroll(
              context.userId!,
              record.employeeId
            );

            fgaChecks.push({
              employeeId: record.employeeId,
              allowed,
            });

            return { record, allowed };
          })
        );

        // Filter to only records the user can access
        filteredRecords = permissionChecks
          .filter((check) => check.allowed)
          .map((check) => check.record);

        console.log(
          `[FGA] User can access ${filteredRecords.length}/${payroll.records.length} records`
        );

        // If user has no access to any records, return access denied
        if (filteredRecords.length === 0) {
          return JSON.stringify({
            success: false,
            error: 'Access Denied: You do not have permission to view this payroll data',
            fgaEnabled: true,
            fgaChecks,
          });
        }
      }

      // Format payroll data for display
      const summary = {
        year: payroll.year,
        totalEmployees: filteredRecords.length,
        totalAmount: filteredRecords.reduce(
          (sum, record) => sum + record.salary + record.bonuses,
          0
        ),
        employees: filteredRecords.map((record) => ({
          id: record.employeeId,
          name: record.name,
          department: record.department,
          totalCompensation: record.salary + record.bonuses,
          salary: record.salary,
          bonuses: record.bonuses,
        })),
        fgaEnabled: context.securityFeatures.fgaEnabled,
        fgaChecks: context.securityFeatures.fgaEnabled ? fgaChecks : undefined,
      };

      const message = context.securityFeatures.fgaEnabled
        ? `Retrieved payroll data for ${year}. FGA authorization passed: showing ${summary.totalEmployees} records you have access to. Total compensation: $${summary.totalAmount.toLocaleString()}`
        : `Retrieved payroll data for ${year} with ${summary.totalEmployees} employees. Total compensation: $${summary.totalAmount.toLocaleString()}`;

      return JSON.stringify({
        success: true,
        data: summary,
        message,
      });
    },
  });
}
