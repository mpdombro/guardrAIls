// Mock Treasury Data for Demo Purposes

export interface PayrollRecord {
  employeeId: string;
  name: string;
  department: string;
  salary: number;
  bonuses: number;
  taxWithholding: number;
}

export interface PayrollFile {
  year: number;
  month?: string;
  records: PayrollRecord[];
  totalAmount: number;
}

export interface BankAccount {
  accountId: string;
  accountName: string;
  accountNumber: string;
  balance: number;
  type: 'checking' | 'savings' | 'payroll';
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  from: string;
  to: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
}

// Mock Payroll Data - 2024 (Sensitive)
export const payroll2024: PayrollFile = {
  year: 2024,
  records: [
    {
      employeeId: 'EMP001',
      name: 'Alice Johnson',
      department: 'Treasury',
      salary: 150000,
      bonuses: 25000,
      taxWithholding: 52500,
    },
    {
      employeeId: 'EMP002',
      name: 'Bob Smith',
      department: 'Treasury',
      salary: 95000,
      bonuses: 10000,
      taxWithholding: 31500,
    },
    {
      employeeId: 'EMP003',
      name: 'Carol Williams',
      department: 'Finance',
      salary: 120000,
      bonuses: 15000,
      taxWithholding: 40500,
    },
    {
      employeeId: 'EMP004',
      name: 'David Brown',
      department: 'Operations',
      salary: 85000,
      bonuses: 8000,
      taxWithholding: 27900,
    },
    {
      employeeId: 'EMP005',
      name: 'Eve Martinez',
      department: 'IT',
      salary: 110000,
      bonuses: 12000,
      taxWithholding: 36600,
    },
    {
      employeeId: 'EMP006',
      name: 'Morty Smith',
      department: 'Finance',
      salary: 98000,
      bonuses: 7000,
      taxWithholding: 31500,
    },
  ],
  totalAmount: 0,
};

// Calculate total
payroll2024.totalAmount = payroll2024.records.reduce(
  (sum, record) => sum + record.salary + record.bonuses,
  0
);

// Mock Payroll Data - 2023 (Sensitive)
export const payroll2023: PayrollFile = {
  year: 2023,
  records: [
    {
      employeeId: 'EMP001',
      name: 'Alice Johnson',
      department: 'Treasury',
      salary: 145000,
      bonuses: 20000,
      taxWithholding: 49500,
    },
    {
      employeeId: 'EMP002',
      name: 'Bob Smith',
      department: 'Treasury',
      salary: 90000,
      bonuses: 8000,
      taxWithholding: 29400,
    },
    {
      employeeId: 'EMP003',
      name: 'Carol Williams',
      department: 'Finance',
      salary: 115000,
      bonuses: 12000,
      taxWithholding: 38100,
    },
    {
      employeeId: 'EMP006',
      name: 'Morty Smith',
      department: 'Finance',
      salary: 92000,
      bonuses: 5000,
      taxWithholding: 29100,
    },
  ],
  totalAmount: 0,
};

payroll2023.totalAmount = payroll2023.records.reduce(
  (sum, record) => sum + record.salary + record.bonuses,
  0
);

// Mock Bank Accounts
export const bankAccounts: BankAccount[] = [
  {
    accountId: 'ACC001',
    accountName: 'Main Checking',
    accountNumber: '****1234',
    balance: 5250000,
    type: 'checking',
  },
  {
    accountId: 'ACC002',
    accountName: 'Payroll Account',
    accountNumber: '****5678',
    balance: 1850000,
    type: 'payroll',
  },
  {
    accountId: 'ACC003',
    accountName: 'Reserve Savings',
    accountNumber: '****9012',
    balance: 10500000,
    type: 'savings',
  },
];

// Mock Transaction History
export const transactionHistory: Transaction[] = [
  {
    id: 'TXN001',
    date: '2024-01-15',
    amount: 250000,
    from: 'ACC001',
    to: 'Vendor: Acme Corp',
    description: 'Q4 2023 Services Payment',
    status: 'completed',
  },
  {
    id: 'TXN002',
    date: '2024-01-10',
    amount: 850000,
    from: 'ACC002',
    to: 'Payroll Distribution',
    description: 'January 2024 Payroll',
    status: 'completed',
  },
  {
    id: 'TXN003',
    date: '2024-01-05',
    amount: 50000,
    from: 'ACC001',
    to: 'Vendor: Tech Solutions LLC',
    description: 'Software Licenses',
    status: 'completed',
  },
];

// Helper functions
export function getPayrollByYear(year: number): PayrollFile | null {
  if (year === 2024) return payroll2024;
  if (year === 2023) return payroll2023;
  return null;
}

export function getBankAccount(accountId: string): BankAccount | null {
  return bankAccounts.find((acc) => acc.accountId === accountId) || null;
}

export function getAllBankAccounts(): BankAccount[] {
  return bankAccounts;
}

export function getTransactionHistory(limit?: number): Transaction[] {
  if (limit) {
    return transactionHistory.slice(0, limit);
  }
  return transactionHistory;
}

// Simulate a bank transfer
export function simulateTransfer(
  fromAccountId: string,
  toAccount: string,
  amount: number,
  description: string
): { success: boolean; transactionId?: string; error?: string } {
  const account = getBankAccount(fromAccountId);

  if (!account) {
    return { success: false, error: 'Source account not found' };
  }

  if (account.balance < amount) {
    return { success: false, error: 'Insufficient funds' };
  }

  if (amount <= 0) {
    return { success: false, error: 'Invalid amount' };
  }

  // Simulate the transfer
  const transactionId = `TXN${Date.now()}`;
  const newTransaction: Transaction = {
    id: transactionId,
    date: new Date().toISOString().split('T')[0],
    amount,
    from: fromAccountId,
    to: toAccount,
    description,
    status: 'completed',
  };

  // Update balance (in real app, would be in database)
  account.balance -= amount;
  transactionHistory.unshift(newTransaction);

  return { success: true, transactionId };
}
