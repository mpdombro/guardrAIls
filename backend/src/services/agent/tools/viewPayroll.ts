import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { getPayrollByYear } from '../../data/treasury.js';

export const viewPayrollTool = new DynamicStructuredTool({
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

    // Format payroll data for display
    const summary = {
      year: payroll.year,
      totalEmployees: payroll.records.length,
      totalAmount: payroll.totalAmount,
      employees: payroll.records.map((record) => ({
        id: record.employeeId,
        name: record.name,
        department: record.department,
        totalCompensation: record.salary + record.bonuses,
        salary: record.salary,
        bonuses: record.bonuses,
      })),
    };

    return JSON.stringify({
      success: true,
      data: summary,
      message: `Retrieved payroll data for ${year} with ${summary.totalEmployees} employees. Total compensation: $${summary.totalAmount.toLocaleString()}`,
    });
  },
});
