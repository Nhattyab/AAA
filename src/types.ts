export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Finance' | 'Seller';
}

export interface UserItem {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Finance' | 'Seller';
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface MaterialItem {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  costPrice: number;
  supplier: string;
  importDate: string;
  restockDate?: string | null;
}

export interface SaleItem {
  id: number;
  sellerId: number;
  customerName: string;
  materialId?: number | null;
  materialName?: string | null;
  materialSku?: string | null;
  quantity: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Transfer' | 'Loan' | 'Paid Loan';
  transferBank?: string | null;
  date: string;
  repaidAmount?: number;
  seller?: {
    id: number;
    name: string;
    email: string;
  };
  material?: {
    id: number;
    name: string;
    sku: string;
  };
}

export interface ExpenseItem {
  id: number;
  category: string;
  amount: number;
  date: string;
  loggedById: number;
  loggedBy?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CompanyLoanItem {
  id: number;
  lender: string;
  amount: number;
  repaidAmount: number;
  date: string;
}

export interface MasterReport {
  revenue: number;
  cogs: number;
  grossProfit: number;
  companyExpenses: number;
  netProfit: number;
  inventoryAssetValue: number;
  outstandingLoans: number;
  outstandingCompanyLoans: number;
}

export interface SellerPerformance {
  sellerId: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  totalSalesAmount: number;
  totalTransactions: number;
  totalItemsSold: number;
  profitContribution: number;
  sales?: Array<{
    id: number;
    customerName: string;
    materialName: string;
    materialSku: string;
    quantity: number;
    totalAmount: number;
    date: string;
  }>;
}
