import React, { useState, useEffect } from 'react';
import {
  Users,
  Package,
  ShoppingCart,
  Coins,
  BarChart3,
  LogOut,
  Plus,
  AlertCircle,
  TrendingUp,
  Trash2,
  Lock,
  UserCheck,
  UserX,
  CreditCard,
  Building2,
  RefreshCw,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  DollarSign,
  Printer,
  Download
} from 'lucide-react';
import {
  UserProfile,
  UserItem,
  MaterialItem,
  SaleItem,
  ExpenseItem,
  MasterReport,
  SellerPerformance,
  CompanyLoanItem
} from './types';
import { exportToCSV, printData } from './utils/exportUtils';

export default function App() {
  // Authentication State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Tab View Management
  // Admin: 'users' | 'inventory' | 'sales' | 'expenses' | 'reports'
  // Finance: 'inventory' | 'expenses' | 'reports'
  // Seller: 'sales' | 'inventory'
  const [activeTab, setActiveTab] = useState<string>('');

  // Global Lists States
  const [users, setUsers] = useState<UserItem[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [expenses, setExpenseList] = useState<ExpenseItem[]>([]);
  
  // Analytics Reports States
  const [masterReport, setMasterReport] = useState<MasterReport | null>(null);
  const [sellerPerformance, setSellerPerformance] = useState<SellerPerformance[]>([]);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  // Filtering and Searching
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentOptionFilter, setPaymentOptionFilter] = useState('All');

  // Loading indicator for operations
  const [loadingAction, setLoadingAction] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  // Material/Restock dynamic states
  const [activeRestockId, setActiveRestockId] = useState<number | null>(null);
  const [restockQty, setRestockQty] = useState<string>('50');
  const [restockDateInput, setRestockDateInput] = useState<string>(new Date().toISOString().split('T')[0]);

  // Editing Sale state
  const [editingSale, setEditingSale] = useState<SaleItem | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editTotalAmount, setEditTotalAmount] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'Cash' | 'Transfer' | 'Loan' | 'Paid Loan'>('Cash');
  const [editTransferBank, setEditTransferBank] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editRepaidAmount, setEditRepaidAmount] = useState('');

  // Editing User state
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserRole, setEditUserRole] = useState<'Admin' | 'Finance' | 'Seller'>('Seller');
  const [editUserStatus, setEditUserStatus] = useState<'active' | 'inactive'>('active');

  // Editing Expense state
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [editExpenseCategory, setEditExpenseCategory] = useState('');
  const [editExpenseAmount, setEditExpenseAmount] = useState('');
  const [editExpenseDate, setEditExpenseDate] = useState('');

  // Company Loans State & Inputs
  const [companyLoans, setCompanyLoans] = useState<CompanyLoanItem[]>([]);
  const [newLender, setNewLender] = useState('');
  const [newLoanAmount, setNewLoanAmount] = useState('');
  const [newLoanDate, setNewLoanDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Editing Company Loan
  const [editingCompanyLoan, setEditingCompanyLoan] = useState<CompanyLoanItem | null>(null);
  const [editLender, setEditLender] = useState('');
  const [editLoanAmount, setEditLoanAmount] = useState('');
  const [editLoanRepaidAmount, setEditLoanRepaidAmount] = useState('');
  const [editLoanDate, setEditLoanDate] = useState('');

  // Inline Repay Amount input values per Company Loan (keyed by loan ID)
  const [repayAmounts, setRepayAmounts] = useState<Record<number, string>>({});

  // Seller details expansion state
  const [expandedSellers, setExpandedSellers] = useState<Record<number, boolean>>({});

  const toggleSellerExpand = (sellerId: number) => {
    setExpandedSellers(prev => ({
      ...prev,
      [sellerId]: !prev[sellerId]
    }));
  };

  // Filtering Dates States
  const [materialStartDate, setMaterialStartDate] = useState('');
  const [materialEndDate, setMaterialEndDate] = useState('');
  const [salesStartDate, setSalesStartDate] = useState('');
  const [salesEndDate, setSalesEndDate] = useState('');
  const [expenseStartDate, setExpenseStartDate] = useState('');
  const [expenseEndDate, setExpenseEndDate] = useState('');
  const [clientLoansStartDate, setClientLoansStartDate] = useState('');
  const [clientLoansEndDate, setClientLoansEndDate] = useState('');
  const [companyLoansStartDate, setCompanyLoansStartDate] = useState('');
  const [companyLoansEndDate, setCompanyLoansEndDate] = useState('');

  // Form inputs
  // A. Add User Form
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Seller' });
  // B. Add Material Form
  const [newMaterial, setNewMaterial] = useState({ name: '', sku: '', quantity: '', costPrice: '', supplier: '', importDate: new Date().toISOString().split('T')[0] });
  // C. Log Sale Form
  const [newSale, setNewSale] = useState({ customerName: '', materialId: '', quantity: '', totalAmount: '', paymentMethod: 'Cash' as 'Cash' | 'Transfer' | 'Loan' | 'Paid Loan', transferBank: '', date: new Date().toISOString().split('T')[0], sellerId: '' });
  // D. Add Expense Form
  const [newExpense, setNewExpense] = useState({ category: '', amount: '', date: new Date().toISOString().split('T')[0] });

  // Get displayed payment method (returns 'Paid Loan' if paymentMethod is 'Paid Loan' or a 'Loan' that has been fully repaid)
  const getDisplayPaymentMethod = (s: SaleItem): string => {
    if (s.paymentMethod === 'Paid Loan') return 'Paid Loan';
    if (s.paymentMethod === 'Loan' && (s.repaidAmount || 0) >= s.totalAmount) {
      return 'Paid Loan';
    }
    return s.paymentMethod;
  };

  // On mount, verify existing JWT cookie
  useEffect(() => {
    checkAuthSession();
  }, []);

  // Set default tabs based on Role once user logs in
  useEffect(() => {
    if (user) {
      if (user.role === 'Admin') {
        setActiveTab('users');
      } else if (user.role === 'Finance') {
        setActiveTab('inventory');
      } else if (user.role === 'Seller') {
        setActiveTab('sales');
      }
      fetchAllData();
    } else {
      setActiveTab('');
    }
  }, [user]);

  // Fetch users when entering sales tab (ensuring Admin and Finance always see the correct active sellers)
  useEffect(() => {
    if (user && (user.role === 'Admin' || user.role === 'Finance') && activeTab === 'sales') {
      fetchUsers();
    }
  }, [activeTab, user]);

  // Unified dynamic filtering for reports: automatically refetch metrics as date filters or activeTab changes
  useEffect(() => {
    if (user && (user.role === 'Admin' || user.role === 'Finance') && activeTab === 'reports') {
      fetchFinancials(reportStartDate, reportEndDate);
    }
  }, [activeTab, reportStartDate, reportEndDate, user]);

  const checkAuthSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Session hydration failed:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setUser(data.user);
          setLoginEmail('');
          setLoginPassword('');
        } else {
          setLoginError('Expected JSON response but received non-JSON from server.');
        }
      } else {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setLoginError(data.error || `Authentication failed with status ${res.status}.`);
        } else {
          const errorText = await res.text();
          setLoginError(`Server Error (${res.status}): ${errorText.substring(0, 100)}...`);
        }
      }
    } catch (err: any) {
      setLoginError(`Network Error: Could not connect to API server. Details: ${err?.message || err}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const fillCredentials = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      // Clear states
      setUsers([]);
      setMaterials([]);
      setSales([]);
      setExpenseList([]);
      setMasterReport(null);
      setSellerPerformance([]);
    } catch (err) {
      console.error('Logout request failed:', err);
    }
  };

  const fetchAllData = () => {
    if (!user) return;
    setApiError('');
    
    // Admin/Finance reads user base
    if (user.role === 'Admin' || user.role === 'Finance') {
      fetchUsers();
    }
    
    // All read inventory
    fetchInventory();

    // Admin/Seller/Finance read sales and company loans
    if (user.role === 'Admin' || user.role === 'Seller' || user.role === 'Finance') {
      fetchSales();
      fetchCompanyLoans();
    }

    // Admin/Finance read expenses and finance reports
    if (user.role === 'Admin' || user.role === 'Finance') {
      fetchExpenses();
      fetchFinancials(reportStartDate, reportEndDate);
    }
  };

  // FETCH API WRAPPERS
  const fetchCompanyLoans = async () => {
    try {
      const res = await fetch('/api/company-loans');
      if (res.ok) {
        const data = await res.json();
        setCompanyLoans(data);
      }
    } catch (err) {
      console.error('Cannot fetch company loans:', err);
    }
  };
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Cannot fetch users:', err);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } catch (err) {
      console.error('Cannot fetch materials:', err);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await fetch('/api/sales');
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      }
    } catch (err) {
      console.error('Cannot fetch sales:', err);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      if (res.ok) {
        const data = await res.json();
        setExpenseList(data);
      }
    } catch (err) {
      console.error('Cannot fetch expenses:', err);
    }
  };

  const fetchFinancials = async (startDate = reportStartDate, endDate = reportEndDate) => {
    try {
      let queryParams = '';
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (params.length > 0) {
        queryParams = `?${params.join('&')}`;
      }

      const res1 = await fetch(`/api/reports/master${queryParams}`);
      if (res1.ok) {
        const data1 = await res1.json();
        setMasterReport(data1);
      }

      const res2 = await fetch(`/api/reports/sellers${queryParams}`);
      if (res2.ok) {
        const data2 = await res2.json();
        setSellerPerformance(data2);
      }
    } catch (err) {
      console.error('Cannot fetch financial reports:', err);
    }
  };

  // POST CRUD WRAPPERS
  // Create User (Admin Only)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setApiSuccess('');
    setLoadingAction(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();
      if (res.ok) {
        setApiSuccess(data.message);
        setNewUser({ name: '', email: '', password: '', role: 'Seller' });
        fetchUsers();
      } else {
        setApiError(data.error || 'Failed to register account.');
      }
    } catch (err) {
      setApiError('Network connection failed.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Toggle user status (Active/Inactive)
  const handleToggleUserStatus = async (userId: number, currentStatus: 'active' | 'inactive') => {
    setApiError('');
    setApiSuccess('');
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        setApiSuccess(`User status updated to ${nextStatus}.`);
        fetchUsers();
        fetchFinancials(); // Refresh seller list report in case status updated
      } else {
        const data = await res.json();
        setApiError(data.error || 'Failed to update user status.');
      }
    } catch (err) {
      setApiError('Network request failed.');
    }
  };

  // Loan Repayments Management State & Handler
  const [repayInputs, setRepayInputs] = useState<{[saleId: number]: string}>({});

  const handleRepayLoan = async (saleId: number, amount: number) => {
    if (isNaN(amount) || amount <= 0) {
      setApiError('Repayment amount must be a valid positive number.');
      return;
    }
    setApiError('');
    setApiSuccess('');
    try {
      const res = await fetch(`/api/sales/${saleId}/repay`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (res.ok) {
        setApiSuccess(data.message || 'Repayment recorded successfully.');
        setRepayInputs(prev => ({ ...prev, [saleId]: '' }));
        fetchSales();
        if (user && (user.role === 'Admin' || user.role === 'Finance')) {
          fetchFinancials(reportStartDate, reportEndDate);
        }
      } else {
        setApiError(data.error || 'Failed to record repayment.');
      }
    } catch (err: any) {
      setApiError(err?.message || 'Network error recording repayment.');
    }
  };

  // Company Loan Management Handlers
  const handleCreateCompanyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLender || !newLoanAmount || !newLoanDate) {
      setApiError('Lender name, amount, and date are required.');
      return;
    }

    setApiError('');
    setApiSuccess('');
    setLoadingAction(true);

    try {
      const res = await fetch('/api/company-loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lender: newLender,
          amount: Number(newLoanAmount),
          date: newLoanDate,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setApiSuccess('Company loan recorded successfully.');
        setNewLender('');
        setNewLoanAmount('');
        setNewLoanDate(new Date().toISOString().split('T')[0]);
        fetchCompanyLoans();
      } else {
        setApiError(data.error || 'Failed to record company loan.');
      }
    } catch (err: any) {
      setApiError(err?.message || 'Network error creating company loan.');
    } finally {
      setLoadingAction(false);
    }
  };

  const startEditCompanyLoan = (loan: CompanyLoanItem) => {
    setEditingCompanyLoan(loan);
    setEditLender(loan.lender);
    setEditLoanAmount(String(loan.amount));
    setEditLoanRepaidAmount(String(loan.repaidAmount || 0));
    setEditLoanDate(loan.date);
  };

  const handleSaveCompanyLoanEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompanyLoan) return;

    setApiError('');
    setApiSuccess('');
    setLoadingAction(true);

    try {
      const res = await fetch(`/api/company-loans/${editingCompanyLoan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lender: editLender,
          amount: Number(editLoanAmount),
          repaidAmount: Number(editLoanRepaidAmount),
          date: editLoanDate,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setApiSuccess('Company loan updated successfully.');
        setEditingCompanyLoan(null);
        fetchCompanyLoans();
      } else {
        setApiError(data.error || 'Failed to update company loan.');
      }
    } catch (err: any) {
      setApiError(err?.message || 'Network error updating company loan.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteCompanyLoan = async (loan: CompanyLoanItem) => {
    setApiError('');
    setApiSuccess('');
    setLoadingAction(true);

    try {
      const res = await fetch(`/api/company-loans/${loan.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setApiSuccess('Company loan record deleted successfully.');
        fetchCompanyLoans();
      } else {
        setApiError(data.error || 'Failed to delete company loan.');
      }
    } catch (err: any) {
      setApiError(err?.message || 'Network error deleting company loan.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRepayCompanyLoan = async (loanId: number, amount: number) => {
    if (isNaN(amount) || amount <= 0) {
      setApiError('Repayment amount must be a valid positive number.');
      return;
    }
    setApiError('');
    setApiSuccess('');
    try {
      const res = await fetch(`/api/company-loans/${loanId}/repay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repayAmount: amount }),
      });
      const data = await res.json();
      if (res.ok) {
        setApiSuccess(data.message || 'Repayment recorded successfully.');
        setRepayAmounts(prev => ({ ...prev, [loanId]: '' }));
        fetchCompanyLoans();
      } else {
        setApiError(data.error || 'Failed to record repayment.');
      }
    } catch (err: any) {
      setApiError(err?.message || 'Network error recording repayment.');
    }
  };

  // Print Loan Registry to PDF
  const handlePrintLoans = () => {
    if (!user) return;
    const activeLoans = sales.filter(s => {
      if (user.role === 'Seller' && s.sellerId !== user.id) return false;
      if (s.paymentMethod !== 'Loan') return false;
      if (clientLoansStartDate && s.date < clientLoansStartDate) return false;
      if (clientLoansEndDate && s.date > clientLoansEndDate) return false;
      return true;
    });
    
    const headers = [
      'Client',
      'Material Name',
      'SKU',
      'Units',
      'Total Loan Amount',
      'Repaid Sum',
      'Balance Due',
      'Date',
      'Status'
    ];
    
    const rows = activeLoans.map(s => {
      const outstanding = s.totalAmount - (s.repaidAmount || 0);
      return [
        s.customerName,
        s.materialName || 'Uncoded Spec',
        s.materialSku || 'N/A',
        s.quantity.toLocaleString('en-US'),
        `$${s.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `$${(s.repaidAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `$${outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        s.date,
        outstanding === 0 ? 'Settled' : 'DUE'
      ];
    });

    const totalLoansAmount = activeLoans.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalRepaidSum = activeLoans.reduce((sum, s) => sum + (s.repaidAmount || 0), 0);
    const totalBalanceDue = totalLoansAmount - totalRepaidSum;

    // Append total row at the bottom of the table to be printed
    rows.push([
      'TOTAL LOANS OUTSTANDING', // Client
      '', // Material Name
      '', // SKU
      '', // Units
      `$${totalLoansAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `$${totalRepaidSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `$${totalBalanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      '', // Date
      ''  // Status
    ]);

    const summarySectionHTML = `
      <div style="display: flex; gap: 40px; margin-top: 5px;">
        <div><strong>Total Credit Issued:</strong> $${totalLoansAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div><strong>Total Recovered:</strong> $${totalRepaidSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div style="color: #e11d48;"><strong>Aggregate Balance Due:</strong> $${totalBalanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>
    `;

    printData('Credit Line & Material Loan Registry Ledger', headers, rows, summarySectionHTML);
  };

  const handlePrintCompanyLoans = () => {
    if (!user) return;
    
    const filteredCompanyLoans = companyLoans.filter(l => {
      if (companyLoansStartDate && l.date < companyLoansStartDate) return false;
      if (companyLoansEndDate && l.date > companyLoansEndDate) return false;
      return true;
    });

    const headers = [
      'Date',
      'Lender (Source)',
      'Total Loan Amount',
      'Repaid Sum',
      'Balance Due'
    ];
    
    const rows = filteredCompanyLoans.map(l => {
      const balance = l.amount - (l.repaidAmount || 0);
      return [
        l.date,
        l.lender,
        `$${l.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `$${(l.repaidAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      ];
    });

    const totalBorrowed = filteredCompanyLoans.reduce((sum, l) => sum + l.amount, 0);
    const totalRepaid = filteredCompanyLoans.reduce((sum, l) => sum + (l.repaidAmount || 0), 0);
    const totalBalance = totalBorrowed - totalRepaid;

    // Append total row at the bottom of the table to be printed
    rows.push([
      'GRAND TOTAL',
      '',
      `$${totalBorrowed.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `$${totalRepaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    ]);

    const summarySectionHTML = `
      <div style="display: flex; gap: 40px; margin-top: 5px;">
        <div><strong>Total Borrowed:</strong> $${totalBorrowed.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div><strong>Total Repaid:</strong> $${totalRepaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div style="color: #e11d48;"><strong>Aggregate Balance Due:</strong> $${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>
    `;

    printData('Company Borrowing Liability Loan Registry Ledger', headers, rows, summarySectionHTML);
  };

  // Create Imported Material (Admin or Finance Only)
  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setApiSuccess('');
    setLoadingAction(true);

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMaterial),
      });

      const data = await res.json();
      if (res.ok) {
        setApiSuccess(data.message);
        setNewMaterial({ name: '', sku: '', quantity: '', costPrice: '', supplier: '', importDate: new Date().toISOString().split('T')[0] });
        fetchInventory();
        fetchFinancials();
      } else {
        setApiError(data.error || 'Failed to save material.');
      }
    } catch (err) {
      setApiError('Network request failed.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Update material quantity and restock date manually
  const handleRestockMaterial = async (materialId: number, name: string, quantityToRestock: number, restockDate: string) => {
    setApiError('');
    setApiSuccess('');

    if (isNaN(quantityToRestock) || quantityToRestock <= 0) {
      setApiError('Restock quantity must be a positive integer.');
      return;
    }

    const item = materials.find(m => m.id === materialId);
    if (!item) return;

    const nextQty = item.quantity + quantityToRestock;
    const combinedRestockDate = `${restockDate} (+${quantityToRestock} units)`;

    try {
      const res = await fetch(`/api/inventory/${materialId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: nextQty, restockDate: combinedRestockDate }),
      });

      if (res.ok) {
        setApiSuccess(`Restocked "${name}" with +${quantityToRestock} units on ${restockDate} successfully.`);
        fetchInventory();
        fetchFinancials(reportStartDate, reportEndDate);
      } else {
        const data = await res.json();
        setApiError(data.error || 'Failed to replenish inventory.');
      }
    } catch (err) {
      setApiError('Network request failed.');
    }
  };

  // Start editing a sale
  const startEditSale = (s: SaleItem) => {
    setEditingSale(s);
    setEditCustomerName(s.customerName);
    setEditQuantity(String(s.quantity));
    setEditTotalAmount(String(s.totalAmount));
    setEditPaymentMethod(s.paymentMethod);
    setEditTransferBank(s.transferBank || '');
    setEditDate(s.date);
    setEditRepaidAmount(String(s.repaidAmount || 0));
  };

  // Save changes to sale
  const handleSaveSaleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    setApiError('');
    setApiSuccess('');
    setLoadingAction(true);

    try {
      const res = await fetch(`/api/sales/${editingSale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: editCustomerName,
          quantity: Number(editQuantity),
          totalAmount: Number(editTotalAmount),
          paymentMethod: editPaymentMethod,
          transferBank: editPaymentMethod === 'Transfer' ? editTransferBank : '',
          date: editDate,
          repaidAmount: editPaymentMethod === 'Loan' ? Number(editRepaidAmount) : 0
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setApiSuccess(data.message || 'Sale invoice record updated successfully.');
        setEditingSale(null);
        fetchSales();
        fetchInventory();
        fetchFinancials(reportStartDate, reportEndDate);
      } else {
        setApiError(data.error || 'Failed to update sale record.');
      }
    } catch (err) {
      setApiError('Network request failed.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Delete sale record
  const handleDeleteSale = async (s: SaleItem) => {
    if (!confirm(`Are you sure you want to permanently delete booked sale TX-SALE-${1000 + s.id}?`)) return;
    setApiError('');
    setApiSuccess('');

    try {
      const res = await fetch(`/api/sales/${s.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        setApiSuccess(data.message || 'Sale record deleted from ledger.');
        fetchSales();
        fetchInventory();
        fetchFinancials(reportStartDate, reportEndDate);
      } else {
        setApiError(data.error || 'Failed to remove sale log.');
      }
    } catch (err) {
      setApiError('Network connection failed.');
    }
  };

  // Delete client loan record from the registry (change payment method to 'Paid Loan' to preserve the sale log)
  const handleDeleteLoanOnly = async (s: SaleItem) => {
    if (!confirm(`Are you sure you want to remove this settled loan from the Loans registry? The sales record for this transaction will be preserved as a Paid Loan.`)) return;
    setApiError('');
    setApiSuccess('');

    try {
      const res = await fetch(`/api/sales/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'Paid Loan',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setApiSuccess('Loan record removed from registry (sales ledger preserved as a Paid Loan).');
        fetchSales();
        fetchInventory();
        fetchFinancials(reportStartDate, reportEndDate);
      } else {
        setApiError(data.error || 'Failed to remove loan record.');
      }
    } catch (err) {
      setApiError('Network connection failed.');
    }
  };

  // Start editing a user
  const startEditUser = (u: UserItem) => {
    setEditingUser(u);
    setEditUserName(u.name);
    setEditUserEmail(u.email);
    setEditUserPassword('');
    setEditUserRole(u.role);
    setEditUserStatus(u.status);
  };

  // Save changes to user
  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setApiError('');
    setApiSuccess('');
    setLoadingAction(true);

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editUserName,
          email: editUserEmail,
          password: editUserPassword || undefined,
          role: editUserRole,
          status: editUserStatus,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setApiSuccess('Staff member updated successfully.');
        setEditingUser(null);
        fetchUsers();
        fetchFinancials(reportStartDate, reportEndDate);
      } else {
        setApiError(data.error || 'Failed to update staff member.');
      }
    } catch (err) {
      setApiError('Network connection failed.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Delete user record
  const handleDeleteUser = async (u: UserItem) => {
    if (!confirm(`Are you absolutely sure you want to permanently delete staff member "${u.name}"?\nWarning: This will also delete all their logged sales and expenses to maintain database consistency!`)) {
      return;
    }
    setApiError('');
    setApiSuccess('');
    setLoadingAction(true);

    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        setApiSuccess(data.message || 'Staff member and their transaction logs deleted successfully.');
        fetchUsers();
        fetchExpenses();
        fetchSales();
        fetchInventory();
        fetchFinancials(reportStartDate, reportEndDate);
      } else {
        setApiError(data.error || 'Failed to delete staff member.');
      }
    } catch (err) {
      setApiError('Network connection failed.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Start editing an expense
  const startEditExpense = (e: ExpenseItem) => {
    setEditingExpense(e);
    setEditExpenseCategory(e.category);
    setEditExpenseAmount(String(e.amount));
    setEditExpenseDate(e.date);
  };

  // Save changes to expense
  const handleSaveExpenseEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    setApiError('');
    setApiSuccess('');
    setLoadingAction(true);

    try {
      const res = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: editExpenseCategory,
          amount: Number(editExpenseAmount),
          date: editExpenseDate,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setApiSuccess('Expense record updated successfully.');
        setEditingExpense(null);
        fetchExpenses();
        fetchFinancials(reportStartDate, reportEndDate);
      } else {
        setApiError(data.error || 'Failed to update expense.');
      }
    } catch (err) {
      setApiError('Network connection failed.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Delete expense record
  const handleDeleteExpense = async (e: ExpenseItem) => {
    if (!confirm(`Are you sure you want to delete the expense entry for "${e.category}" in amount of $${e.amount}?`)) {
      return;
    }
    setApiError('');
    setApiSuccess('');
    setLoadingAction(true);

    try {
      const res = await fetch(`/api/expenses/${e.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        setApiSuccess(data.message || 'Expense record deleted successfully.');
        fetchExpenses();
        fetchFinancials(reportStartDate, reportEndDate);
      } else {
        setApiError(data.error || 'Failed to delete expense.');
      }
    } catch (err) {
      setApiError('Network connection failed.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Delete Material (Admin only)
  const handleDeleteMaterial = async (materialId: number, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete raw material "${name}"?`)) return;
    setApiError('');
    setApiSuccess('');

    try {
      const res = await fetch(`/api/inventory/${materialId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        setApiSuccess(data.message);
        fetchInventory();
        fetchFinancials();
      } else {
        setApiError(data.error || 'Failed to remove material record.');
      }
    } catch (err) {
      setApiError('Network request failed.');
    }
  };

  // Log Sale transaction
  const handleLogSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setApiSuccess('');
    setLoadingAction(true);

    if (!newSale.materialId) {
      setApiError('Please select a material in inventory.');
      setLoadingAction(false);
      return;
    }

    if ((user?.role === 'Admin' || user?.role === 'Finance') && !newSale.sellerId) {
      setApiError('Please assign a seller account responsible for this activity.');
      setLoadingAction(false);
      return;
    }

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSale),
      });

      const data = await res.json();
      if (res.ok) {
        setApiSuccess(data.message);
        setNewSale({ customerName: '', materialId: '', quantity: '', totalAmount: '', paymentMethod: 'Cash', transferBank: '', date: new Date().toISOString().split('T')[0], sellerId: '' });
        fetchSales();
        fetchInventory();
        fetchFinancials(reportStartDate, reportEndDate);
      } else {
        setApiError(data.error || 'Failed to record sales log.');
      }
    } catch (err) {
      setApiError('Network connection failed.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Record Expense payout
  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setApiSuccess('');
    setLoadingAction(true);

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense),
      });

      const data = await res.json();
      if (res.ok) {
        setApiSuccess(data.message);
        setNewExpense({ category: '', amount: '', date: new Date().toISOString().split('T')[0] });
        fetchExpenses();
        fetchFinancials();
      } else {
        setApiError(data.error || 'Failed to submit expense.');
      }
    } catch (err) {
      setApiError('Network connection failed.');
    } finally {
      setLoadingAction(false);
    }
  };



  // 1. Export Material Inventory
  const handleExportInventory = (format: 'print' | 'excel') => {
    const filtered = materials
      .filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.sku.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .filter(m => {
        if (!materialStartDate && !materialEndDate) return true;
        const dStr = m.importDate;
        const rStr = m.restockDate ? m.restockDate.substring(0, 10) : null;
        const start = materialStartDate ? materialStartDate : '0000-00-00';
        const end = materialEndDate ? materialEndDate : '9999-12-31';
        
        const satisfiesImport = dStr >= start && dStr <= end;
        const satisfiesRestock = rStr ? (rStr >= start && rStr <= end) : false;
        
        return satisfiesImport || satisfiesRestock;
      });

    const headers = user.role === 'Admin'
      ? ['ID', 'Material Name', 'SKU', 'Remaining Stock', 'Cost Price (USD)', 'Total Value (USD)', 'Supplier Origin', 'Import Date', 'Last Restocked']
      : ['ID', 'Material Name', 'SKU', 'Remaining Stock', 'Supplier Origin', 'Import Date', 'Last Restocked'];

    const rows = filtered.map(m => {
      if (user.role === 'Admin') {
        return [
          m.id.toString(),
          m.name,
          m.sku,
          m.quantity.toLocaleString('en-US'),
          `$${m.costPrice.toFixed(2)}`,
          `$${(m.quantity * m.costPrice).toFixed(2)}`,
          m.supplier,
          m.importDate,
          m.restockDate || 'N/A'
        ];
      } else {
        return [
          m.id.toString(),
          m.name,
          m.sku,
          m.quantity.toLocaleString('en-US'),
          m.supplier,
          m.importDate,
          m.restockDate || 'N/A'
        ];
      }
    });

    if (format === 'excel') {
      exportToCSV(headers, rows, `Material_Inventory_Registry_${new Date().toISOString().split('T')[0]}`);
      setApiSuccess('Inventory exported to Excel CSV successfully!');
    } else {
      printData('Material Inventory Registry', headers, rows.map(r => r.map(String)));
      setApiSuccess('System print requested for Material Inventory Registry.');
    }
  };

  // 2. Export Sales Export Logistics
  const handleExportSales = (format: 'print' | 'excel') => {
    const filtered = sales
      .filter(s => paymentOptionFilter === 'All' || getDisplayPaymentMethod(s) === paymentOptionFilter)
      .filter(s => {
        if (!salesStartDate && !salesEndDate) return true;
        const start = salesStartDate ? salesStartDate : '0000-00-00';
        const end = salesEndDate ? salesEndDate : '9999-12-31';
        return s.date >= start && s.date <= end;
      });

    const totalIncome = filtered.reduce((acc, s) => acc + s.totalAmount, 0);

    const headers = ['TX ID', 'Invoice Date', 'Logged Seller', 'Recipient Client', 'Material Disbursed', 'SKU', 'Qty Sold', 'Invoice Total', 'Payment Basis', 'Ethiopian Bank'];
    const rows = filtered.map(s => [
      `TX-SALE-${1000 + s.id}`,
      s.date,
      s.seller?.name || `Seller #${s.sellerId}`,
      s.customerName,
      s.material?.name || s.materialName || `Material #${s.materialId}`,
      s.material?.sku || s.materialSku || 'N/A',
      s.quantity.toLocaleString('en-US'),
      `$${s.totalAmount.toFixed(2)}`,
      getDisplayPaymentMethod(s),
      getDisplayPaymentMethod(s) === 'Transfer' ? (s.transferBank || 'N/A') : '-'
    ]);

    if (format === 'excel') {
      const excelRows = [...rows, [
        'TOTALS',
        '',
        '',
        '',
        'Gross Export Income:',
        '',
        '',
        `$${totalIncome.toFixed(2)}`,
        '',
        ''
      ]];
      exportToCSV(headers, excelRows, `Sales_Export_Logistics_${new Date().toISOString().split('T')[0]}`);
      setApiSuccess('Sales exported to Excel CSV successfully!');
    } else {
      const printRows = [...rows.map(r => r.map(String)), [
        '<strong>GROSS EXPORT TOTAL</strong>',
        '',
        '',
        '',
        '<strong>Gross Export Income:</strong>',
        '',
        '',
        `<strong>$${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>`,
        '',
        ''
      ]];
      printData('Sales Records', headers, printRows);
      setApiSuccess('System print requested for Sales Records.');
    }
  };

  // 3. Export Company Expense Ledger
  const handleExportExpenses = (format: 'print' | 'excel') => {
    const filtered = expenses.filter(e => {
      if (!expenseStartDate && !expenseEndDate) return true;
      const start = expenseStartDate ? expenseStartDate : '0000-00-00';
      const end = expenseEndDate ? expenseEndDate : '9999-12-31';
      return e.date >= start && e.date <= end;
    });

    const headers = ['TX ID', 'Expense Category', 'Logged By Staff', 'Payment Date', 'Sum Disbursed'];
    const rows = filtered.map(e => [
      `TX-EXP-${1000 + e.id}`,
      e.category,
      `${e.loggedBy?.name || `User #${e.loggedById}`} (${e.loggedBy?.email || 'N/A'})`,
      e.date,
      `$${e.amount.toFixed(2)}`
    ]);

    if (format === 'excel') {
      exportToCSV(headers, rows, `Company_Expense_Ledger_${new Date().toISOString().split('T')[0]}`);
      setApiSuccess('Expenses exported to Excel CSV successfully!');
    } else {
      printData('Company Expense Records', headers, rows.map(r => r.map(String)));
      setApiSuccess('System print requested for Company Expense Ledger.');
    }
  };

  // 4. Export Company Financial Performance Reports
  const handleExportReports = (format: 'print' | 'excel') => {
    if (!masterReport) {
      setApiError('No financial metrics loaded to export.');
      return;
    }

    const reportRange = (reportStartDate || reportEndDate) 
      ? `Filtered Range: ${reportStartDate || 'Inception'} to ${reportEndDate || 'Present'}`
      : 'Filter Scope: All-time historical imports';

    if (format === 'excel') {
      // Create a unified summary CSV sheet
      const summaryHeaders = ['FINANCIAL REPORT METRIC', 'CALCULATED VALUE (USD)', 'NOTES / SCOPE'];
      const summaryRows = [
        ['Revenue (Total Books)', `$${masterReport.revenue.toFixed(2)}`, 'Aggregate gross sales volume from seller desks.'],
        ['Cost of Goods Sold (COGS)', `$${masterReport.cogs.toFixed(2)}`, 'Aggregate import cost basis of materials sold.'],
        ['Gross Profit Margin', `$${masterReport.grossProfit.toFixed(2)}`, 'Sales Revenue less Cost of Goods Sold.'],
        ['Outstanding Client Loans', `$${(masterReport.outstandingLoans || 0).toFixed(2)}`, 'Total remaining unpaid client loan balance.'],
        ['Outstanding Company Loans', `$${(masterReport.outstandingCompanyLoans || 0).toFixed(2)}`, 'Total remaining unpaid company debt balance.'],
        ['Logged Company Expenses', `$${masterReport.companyExpenses.toFixed(2)}`, 'General utility, shipping, freight, and custom clearance depletions.'],
        ['Net Profit (Final Margin)', `$${masterReport.netProfit.toFixed(2)}`, 'Gross Profit less logged expenses.'],
        ['Material Asset Valuation', `$${masterReport.inventoryAssetValue.toFixed(2)}`, 'Aggregate cost valuation of materials currently remaining in warehouses.'],
        ['', '', ''],
        ['SELLER PERFORMANCE REGISTRY', '', ''],
        ['Seller Name', 'Total Sales Amount', 'Transactions Count', 'Sellers Email', 'Status']
      ];

      sellerPerformance.forEach(seller => {
        summaryRows.push([
          seller.name,
          `$${seller.totalSalesAmount.toFixed(2)}`,
          `${seller.totalTransactions} tx (${seller.totalItemsSold} items)`,
          seller.email,
          seller.status
        ]);
      });

      exportToCSV(summaryHeaders, summaryRows, `Company_Financial_Report_${new Date().toISOString().split('T')[0]}`);
      setApiSuccess('Financial reports portfolio exported to Excel CSV successfully!');
    } else {
      // Print as a gorgeous PDF layout with a top KPI box section
      const summarySectionHTML = `
        <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Financial KPI Indicators</div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px;">
          <div style="background-color: #f1f5f9; padding: 10px; border-radius: 6px;">
            <div style="font-size: 9px; color: #64748b; text-transform: uppercase;">Total Sales Revenue</div>
            <div style="font-size: 15px; font-weight: 700; color: #0f172a;">$${masterReport.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
          <div style="background-color: #f1f5f9; padding: 10px; border-radius: 6px;">
            <div style="font-size: 9px; color: #64748b; text-transform: uppercase;">Cost of Goods Sold</div>
            <div style="font-size: 15px; font-weight: 700; color: #0f172a;">$${masterReport.cogs.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
          <div style="background-color: #f1f5f9; padding: 10px; border-radius: 6px;">
            <div style="font-size: 9px; color: #64748b; text-transform: uppercase;">Outstanding Client Loans</div>
            <div style="font-size: 15px; font-weight: 700; color: #0f172a;">$${(masterReport.outstandingLoans || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
          <div style="background-color: #f1f5f9; padding: 10px; border-radius: 6px;">
            <div style="font-size: 9px; color: #64748b; text-transform: uppercase;">Outstanding Company Loans</div>
            <div style="font-size: 15px; font-weight: 700; color: #0f172a;">$${(masterReport.outstandingCompanyLoans || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
          <div style="background-color: #f1f5f9; padding: 10px; border-radius: 6px;">
            <div style="font-size: 9px; color: #64748b; text-transform: uppercase;">Operating Expenses</div>
            <div style="font-size: 15px; font-weight: 700; color: #0f172a;">$${masterReport.companyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
          <div style="background-color: ${masterReport.netProfit >= 0 ? '#ecfdf5' : '#fef2f2'}; padding: 10px; border-radius: 6px; border: 1px solid ${masterReport.netProfit >= 0 ? '#86efac' : '#fca5a5'};">
            <div style="font-size: 9px; color: ${masterReport.netProfit >= 0 ? '#166534' : '#991b1b'}; text-transform: uppercase;">Net Profit Surplus</div>
            <div style="font-size: 15px; font-weight: 850; color: ${masterReport.netProfit >= 0 ? '#15803d' : '#b91c1c'};">$${masterReport.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
        <div style="font-size: 10px; color: #64748b; margin-bottom: 10px;">* Financial reports are calculated over date range: <strong>${reportRange}</strong>. Warehoused asset valuation: <strong>$${masterReport.inventoryAssetValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></div>
      `;

      // Main Seller list headers
      const headers = ['Rank', 'Seller Agent', 'Agent Email', 'Working Status', 'Aggregate Sales', 'Transactions', 'Items Disbursed', 'Profit contribution'];
      const rows = sellerPerformance.map((seller, idx) => [
        `#${idx + 1}`,
        seller.name,
        seller.email,
        seller.status.toUpperCase(),
        `$${seller.totalSalesAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `${seller.totalTransactions} orders`,
        `${seller.totalItemsSold} Items`,
        `$${seller.profitContribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      ]);

      printData(`Company Financial Report`, headers, rows, summarySectionHTML);
      setApiSuccess('System print requested for Consolidated Balance Sheets.');
    }
  };


  // RENDER SEED AUTH SHEETS FOR DIRECT LOGINS
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4" id="div-loading-screen">
        <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin" id="icon-spinner-loading" />
        <span className="text-sm font-medium text-slate-600" id="text-loading">Securing credentials and loading store balance books...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-900 font-sans" id="auth-parent">
        {/* Left Side: Branding / Promotional banner */}
        <div className="flex-1 flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white border-b md:border-b-0 md:border-r border-slate-800" id="branding-panel">
          <div className="flex items-center gap-3" id="brand-logo-container">
            <div className="bg-indigo-600 p-2 rounded-lg" id="logo-badge">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-mono">Alexander Import & Export</span>
          </div>
          
          <div className="my-12 md:my-0" id="promotional-context">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
              Store & Sales <span className="text-indigo-400">Management</span> System.
            </h1>
          </div>

          <div className="text-xs text-slate-500 font-mono" id="current-timestamp">
            SYSTEM DEVELOPED BY : <a href="https://t.me/Abityazz" className="text-[#b3b302]">Natnael Eyob</a>
          </div>
        </div>

        {/* Right Side: Login Interaction Sheet */}
        <div className="flex-1 flex flex-col justify-center items-center p-8 bg-slate-950 text-slate-200" id="form-panel-sec">
          <div className="w-full max-w-md space-y-8" id="form-parent-block">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-100">Sign in to Management Panel</h2>
              <p className="text-sm text-slate-400">Enter your credentials.</p>
            </div>

            {loginError && (
              <div className="bg-red-950/50 border border-red-500/50 p-4 rounded-lg flex items-start gap-3" id="login-error-log">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span className="text-xs text-red-300 font-medium">{loginError}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleLogin} id="auth-sign-in-form">
              <div className="space-y-1.5" id="group-email">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Username</label>
                <input
                  type="text"
                  id="input-login-email"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="admin@company.com or username"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5" id="group-password">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Password</label>
                <input
                  type="password"
                  id="input-login-password"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                id="btn-submit-credentials"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-lg shadow-indigo-600/10 uppercase tracking-wider block"
              >
                Sign In
              </button>
            </form>

          </div>
        </div>
      </div>
    );
  }

  // CORE LOGGED IN COMPONENT LAYOUT
  return (
    <div className="min-h-screen flex flex-col bg-slate-55 border-slate-100 font-sans" id="logged-parent-canvas">
      {/* Dynamic Notifications Banner */}
      {(apiError || apiSuccess) && (
        <div className="fixed bottom-5 right-5 z-55 max-w-md w-full space-y-2" id="toast-wrapper">
          {apiError && (
            <div className="bg-red-50 text-red-800 border-l-4 border-red-500 shadow-md p-4 rounded flex items-start gap-3" id="err-alert-toast">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <div className="text-xs font-medium">
                {apiError}
              </div>
              <button onClick={() => setApiError('')} className="ml-auto text-red-400 hover:text-red-700 font-bold text-xs" id="close-toast-1">✕</button>
            </div>
          )}
          {apiSuccess && (
            <div className="bg-emerald-50 text-emerald-900 border-l-4 border-emerald-500 shadow-md p-4 rounded flex items-start gap-3" id="suc-alert-toast">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div className="text-xs font-medium">
                {apiSuccess}
              </div>
              <button onClick={() => setApiSuccess('')} className="ml-auto text-emerald-400 hover:text-emerald-700 font-bold text-xs" id="close-toast-2">✕</button>
            </div>
          )}
        </div>
      )}

      {/* Main Header Brand Nav */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shrink-0 px-6 py-4 flex items-center justify-between shadow-xl" id="nav-system-header">
        <div className="flex items-center gap-3" id="brand-nav-context">
          <div className="bg-indigo-600 p-1.5 rounded-md" id="badge-icon-nav">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold font-mono tracking-tight text-white text-base">Alexander Import & Export</span>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline px-2 py-0.5 bg-slate-800 rounded">v1.1</span>
        </div>

        {/* User Context Area */}
        <div className="flex items-center gap-4" id="header-user-badge">
          <div className="text-right" id="user-info-text-block">
            <div className="text-sm font-semibold text-slate-100">{user.name}</div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 flex items-center justify-end gap-1.5">
              <span className={`w-2 h-2 rounded-full inline-block ${
                user.role === 'Admin' ? 'bg-rose-500' : user.role === 'Finance' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
              {user.role} Status
            </div>
          </div>
          
          <button
            onClick={() => { fetchAllData(); setApiSuccess('Database books synchronized successfully.'); }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
            title="Reload Books"
            id="btn-sync-all-books"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleLogout}
            id="btn-exit"
            className="bg-slate-800 hover:bg-red-950 border border-slate-700 hover:border-red-800 text-slate-300 hover:text-red-300 p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Log Out</span>
          </button>
        </div>
      </header>

      {/* Primary Grid Layout */}
      <div className="flex-1 flex flex-col md:flex-row" id="workspace-grid-wrapper">
        
        {/* SIDE BAR BUTTONS GRIP */}
        <aside className="w-full md:w-64 bg-slate-950 text-slate-300 border-r border-slate-900 flex flex-col p-4 space-y-6" id="sidebar-context-control">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-3 px-2">Navigation Ledger</span>
            <div className="space-y-1" id="nav-btn-list">
              {/* Access rules: Admin can view all */}
              {user.role === 'Admin' && (
                <button
                  id="tab-btn-users"
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  Staff Management
                </button>
              )}

              {(user.role === 'Admin' || user.role === 'Finance' || user.role === 'Seller') && (
                <button
                  id="tab-btn-inventory"
                  onClick={() => setActiveTab('inventory')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'inventory' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Package className="w-4 h-4 shrink-0" />
                  Material Inventory
                </button>
              )}

              {(user.role === 'Admin' || user.role === 'Seller' || user.role === 'Finance') && (
                <button
                  id="tab-btn-sales"
                  onClick={() => setActiveTab('sales')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'sales' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 shrink-0" />
                  Sales Log
                </button>
              )}

              {(user.role === 'Admin' || user.role === 'Finance') && (
                <button
                  id="tab-btn-loans"
                  onClick={() => setActiveTab('loans')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'loans' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  Company & Client Loan
                </button>
              )}

              {(user.role === 'Admin' || user.role === 'Finance') && (
                <button
                  id="tab-btn-expenses"
                  onClick={() => setActiveTab('expenses')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'expenses' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Coins className="w-4 h-4 shrink-0" />
                  Company Expenses
                </button>
              )}

              {(user.role === 'Admin' || user.role === 'Finance') && (
                <button
                  id="tab-btn-reports"
                  onClick={() => setActiveTab('reports')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  Financial Reports
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* WORKSPACE CENTRAL CANVAS */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full" id="workspace-primary-dashboard">
          
          {/* TAB 1: Staff MANAGEMENT PANEL (Admin Only) */}
          {activeTab === 'users' && user.role === 'Admin' && (
            <div className="space-y-6" id="tab-users-wrapper">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4" id="users-panel-header">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950">Staff Members Management</h1>
                  <p className="text-xs text-slate-500">Add, view, edit, and toggle activation status for Staff Members.</p>
                </div>
              </div>

              {/* Grid 2 Cols: Form on right, Table on left */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="users-sub-grid">
                
                {/* Users Table */}
                <div className="bg-white border border-slate-100 rounded-xl shadow-sm lg:col-span-2 overflow-hidden flex flex-col" id="users-table-container">
                  <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between" id="users-search-top">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Staff Members List ({users.length})</span>
                    <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-semibold">Admin Access Secure</span>
                  </div>
                  
                  <div className="overflow-x-auto" id="users-table-view">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 font-semibold uppercase text-slate-600 tracking-wider">
                          <th className="p-3">Staff Name</th>
                          <th className="p-3">Email Contact</th>
                          <th className="p-3">Role Group</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Action Options</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-55" id="users-tbody">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3 font-semibold text-slate-900">{u.name} {u.id === user.id && <span className="text-[10px] px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded ml-1">You</span>}</td>
                            <td className="p-3 text-slate-500 font-mono">{u.email}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                                u.role === 'Admin' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                u.role === 'Finance' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1 ${
                                u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                {u.status}
                              </span>
                            </td>
                            <td className="p-3 text-right whitespace-nowrap">
                              {u.email === 'admin@company.com' ? (
                                <span className="text-[10px] font-mono text-slate-400 italic">System Protected</span>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 justify-end" id={`user-actions-${u.id}`}>
                                  <button
                                    onClick={() => startEditUser(u)}
                                    className="px-2 py-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors cursor-pointer"
                                    title="Edit User Info"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    id={`btn-toggle-user-${u.id}`}
                                    onClick={() => handleToggleUserStatus(u.id, u.status)}
                                    className={`px-2 py-1 text-[10px] font-semibold rounded border transition-colors cursor-pointer ${
                                      u.status === 'active' 
                                        ? 'bg-white hover:bg-amber-50 text-amber-600 border-slate-200 hover:border-amber-200' 
                                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                                    }`}
                                    title="Toggle Account Activation Status"
                                  >
                                    {u.status === 'active' ? 'Suspend' : 'Activate'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u)}
                                    className="p-1 text-red-650 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded transition-colors cursor-pointer flex items-center justify-center w-6 h-6"
                                    title="Permanently Delete Staff Record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Create Form Card */}
                <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6" id="add-user-card-form">
                  <div className="flex items-center gap-2 mb-4" id="add-user-header">
                    <Lock className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Add New Staff Member</h3>
                  </div>

                  <form className="space-y-4" onSubmit={handleCreateUser} id="staff-creation-form">
                    <div className="space-y-1" id="staff-form-name-group">
                      <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Full Name</label>
                      <input
                        type="text"
                        id="staff-input-name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        placeholder="John Doe"
                        value={newUser.name}
                        onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-1" id="staff-form-email-group">
                      <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Username / Email</label>
                      <input
                        type="text"
                        id="staff-input-email"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        placeholder="johndoe or john.doe@company.com"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-1" id="staff-form-password-group">
                      <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Initial Password</label>
                      <input
                        type="text"
                        id="staff-input-password"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        placeholder="strong-password-123"
                        value={newUser.password}
                        onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-1" id="staff-form-role-group">
                      <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Staff Role Group</label>
                      <select
                        id="staff-select-role"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        value={newUser.role}
                        onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                        required
                      >
                        <option value="Seller">Seller (Logs & record sales only)</option>
                        <option value="Finance">Finance (Expenses & Master Financials)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      id="staff-submit-btn"
                      disabled={loadingAction}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-all uppercase tracking-wider block"
                    >
                      {loadingAction ? 'Hashing password...' : 'Register Member'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}


          {/* TAB 2: MATERIAL INVENTORY (Imports) */}
          {activeTab === 'inventory' && (
            <div className="space-y-6" id="tab-inventory-wrapper">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4" id="inv-header">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950">Material Inventory Registry (Imports)</h1>
                  <p className="text-xs text-slate-500">
                    Track raw materials imported from partners. 
                    {user.role !== 'Seller' ? ' Modifiable by Admin and Finance.' : ' Read-only lookup permissions for dynamic stock decrementing.'}
                  </p>
                </div>
                <div className="flex items-center gap-2" id="inv-export-buttons">
                  <button
                    onClick={() => handleExportInventory('print')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-705 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    title="Print PDF list"
                    id="btn-inv-print"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    Print PDF
                  </button>
                  <button
                    onClick={() => handleExportInventory('excel')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    title="Export list to Excel"
                    id="btn-inv-excel"
                  >
                    <Download className="w-4 h-4 text-indigo-500" />
                    Excel Export
                  </button>
                </div>
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="inv-grid-wrapper">
                
                {/* Inventory Table Container */}
                <div className="bg-white border border-slate-100 rounded-xl shadow-sm lg:col-span-2 overflow-hidden flex flex-col" id="inventory-sheet-grid font-sans">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3" id="filters-panel">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Registry</span>
                    
                    {/* Date Filters & Search Field */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">From</span>
                        <input
                          type="date"
                          id="mat-start-date"
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-[11px] h-[30px]"
                          value={materialStartDate}
                          onChange={(e) => setMaterialStartDate(e.target.value)}
                        />
                        <span className="text-[10px] uppercase font-bold text-slate-400">To</span>
                        <input
                          type="date"
                          id="mat-end-date"
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-[11px] h-[30px]"
                          value={materialEndDate}
                          onChange={(e) => setMaterialEndDate(e.target.value)}
                        />
                      </div>
                      
                      {/* Search Field */}
                      <div className="relative w-full sm:w-48" id="search-input-box">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          id="inv-search-query"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-slate-800 text-[11px] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 h-[30px]"
                          placeholder="Search SKU / Material Name"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      
                      {(materialStartDate || materialEndDate) && (
                        <button
                          onClick={() => { setMaterialStartDate(''); setMaterialEndDate(''); }}
                          className="text-[10px] text-red-500 hover:underline font-semibold font-mono cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto" id="material-table-element">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 font-semibold uppercase text-slate-600 tracking-wider">
                          <th className="p-3">Material & SKU</th>
                          <th className="p-3">Import Date</th>
                          <th className="p-3">Last Restocked</th>
                          <th className="p-3">Remaining Stock</th>
                          {user.role === 'Admin' && <th className="p-3">Cost Basis (Unit)</th>}
                          <th className="p-3">Supplier Origin</th>
                          {user.role !== 'Seller' && <th className="p-3 text-right">Audit Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100" id="materials-tbody">
                        {materials
                          .filter(m => 
                            m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            m.sku.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .filter(m => {
                            if (!materialStartDate && !materialEndDate) return true;
                            const dStr = m.importDate;
                            const rStr = m.restockDate ? m.restockDate.substring(0, 10) : null;
                            const start = materialStartDate ? materialStartDate : '0000-00-00';
                            const end = materialEndDate ? materialEndDate : '9999-12-31';
                            
                            const satisfiesImport = dStr >= start && dStr <= end;
                            const satisfiesRestock = rStr ? (rStr >= start && rStr <= end) : false;
                            
                            return satisfiesImport || satisfiesRestock;
                          })
                          .map(m => {
                            const isLowStock = m.quantity < 50;
                            return (
                              <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3">
                                  <div className="font-semibold text-slate-900">{m.name}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">{m.sku}</div>
                                </td>
                                <td className="p-3 font-mono text-slate-500">
                                  {m.importDate}
                                </td>
                                <td className="p-3">
                                  {m.restockDate ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-mono" title="Last Restocked Date">
                                      ↻ {m.restockDate}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic text-[11px]">Never Restocked</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-1.5 font-semibold text-slate-800 font-mono">
                                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${isLowStock ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
                                    {m.quantity} Unit{m.quantity !== 1 && 's'}
                                  </div>
                                  {isLowStock && (
                                    <div className="text-[9px] text-amber-600 font-medium font-sans">Critical Stock Level Warning</div>
                                  )}
                                </td>
                                {user.role === 'Admin' && (
                                  <td className="p-3 font-mono font-semibold text-indigo-700">${m.costPrice.toFixed(2)}</td>
                                )}
                                <td className="p-3 text-slate-600">{m.supplier}</td>
                                
                                {user.role !== 'Seller' && (
                                  <td className="p-3 text-right whitespace-nowrap">
                                    {activeRestockId === m.id ? (
                                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100" id={`restock-form-${m.id}`}>
                                        <div className="flex flex-col items-start">
                                          <span className="text-[8px] text-slate-550 uppercase font-mono font-bold">Qty</span>
                                          <input
                                            type="number"
                                            className="w-16 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-semibold"
                                            value={restockQty}
                                            onChange={(e) => setRestockQty(e.target.value)}
                                            placeholder="QTY"
                                          />
                                        </div>
                                        <div className="flex flex-col items-start">
                                          <span className="text-[8px] text-slate-550 uppercase font-mono font-bold">Date</span>
                                          <input
                                            type="date"
                                            className="w-24 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px]"
                                            value={restockDateInput}
                                            onChange={(e) => setRestockDateInput(e.target.value)}
                                          />
                                        </div>
                                        <div className="flex gap-1 mt-2 sm:mt-0">
                                          <button
                                            onClick={() => {
                                              handleRestockMaterial(m.id, m.name, Number(restockQty), restockDateInput);
                                              setActiveRestockId(null);
                                            }}
                                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer"
                                            title="Confirm Restock"
                                          >
                                            Confirm
                                          </button>
                                          <button
                                            onClick={() => setActiveRestockId(null)}
                                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] cursor-pointer"
                                            title="Cancel"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="inline-flex gap-1" id={`audit-actions-grp-${m.id}`}>
                                        <button
                                          id={`btn-stock-add-${m.id}`}
                                          title="Replenish stock manually"
                                          onClick={() => {
                                            setActiveRestockId(m.id);
                                            setRestockQty('50');
                                            setRestockDateInput(new Date().toISOString().split('T')[0]);
                                          }}
                                          className="p-1 px-1.5 bg-slate-50 hover:bg-indigo-50 text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded text-[10px] transition-colors cursor-pointer font-bold"
                                        >
                                          + Restock
                                        </button>
                                        
                                        {user.role === 'Admin' && (
                                          <button
                                            id={`btn-mat-delete-${m.id}`}
                                            title="De-register SKU Item"
                                            onClick={() => handleDeleteMaterial(m.id, m.name)}
                                            className="p-1 text-red-600 hover:bg-red-50 border border-slate-200 rounded hover:border-red-200 transition-colors cursor-pointer flex items-center justify-center"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        {materials.length === 0 && (
                          <tr>
                            <td colSpan={user.role === 'Admin' ? 7 : 6} className="p-8 text-center text-slate-400 font-mono">
                              No imported materials registered in inventory.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Import New Material Form Panel */}
                <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6" id="add-material-card">
                  <div className="flex items-center gap-2 mb-4" id="add-material-title">
                    <TrendingUp className="w-5 h-5 text-indigo-600 animate-pulse" />
                    <h3 className="font-bold text-slate-900 text-sm">Register Imported Stock</h3>
                  </div>

                  {user.role === 'Seller' ? (
                    <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-lg text-xs space-y-2" id="seller-warn">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <p className="font-medium">Seller permissions restricted to read-only views.</p>
                      <p className="text-slate-500">Only Admin and Finance staff can register imported materials, restock items, or de-register SKU codes.</p>
                    </div>
                  ) : (
                    <form className="space-y-3" onSubmit={handleCreateMaterial} id="form-import-materials">
                      <div className="space-y-1" id="group-iname">
                        <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Material Name</label>
                        <input
                          type="text"
                          id="mat-input-name"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          placeholder="Titanium Alloys"
                          value={newMaterial.name}
                          onChange={(e) => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2" id="grid-sku-qty">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">SKU Code</label>
                          <input
                            type="text"
                            id="mat-input-sku"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none uppercase"
                            placeholder="TTN-ALY-X"
                            value={newMaterial.sku}
                            onChange={(e) => setNewMaterial(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Initial Qty</label>
                          <input
                            type="number"
                            id="mat-input-quantity"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            placeholder="200"
                            min="1"
                            value={newMaterial.quantity}
                            onChange={(e) => setNewMaterial(prev => ({ ...prev, quantity: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className={user.role === 'Admin' ? "grid grid-cols-2 gap-2" : "space-y-1"} id="grid-cost-date">
                        {user.role === 'Admin' && (
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Import Cost ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              id="mat-input-cost"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              placeholder="45.50"
                              min="0.01"
                              value={newMaterial.costPrice}
                              onChange={(e) => setNewMaterial(prev => ({ ...prev, costPrice: e.target.value }))}
                              required={user.role === 'Admin'}
                            />
                          </div>
                        )}
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Import Date</label>
                          <input
                            type="date"
                            id="mat-input-date"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            value={newMaterial.importDate}
                            onChange={(e) => setNewMaterial(prev => ({ ...prev, importDate: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1" id="group-isupplier">
                        <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Supplier Origin Co.</label>
                        <input
                          type="text"
                          id="mat-input-supplier"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          placeholder="Global Metals S.A."
                          value={newMaterial.supplier}
                          onChange={(e) => setNewMaterial(prev => ({ ...prev, supplier: e.target.value }))}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        id="mat-submit-btn"
                        disabled={loadingAction}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-all uppercase tracking-wider block"
                      >
                        {loadingAction ? 'Connecting pipeline...' : 'Register Raw Stock'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}


          {/* TAB 3: SALES & CLIENT PANELS (Sellers/Admins/Finance) */}
          {activeTab === 'sales' && (user.role === 'Admin' || user.role === 'Seller' || user.role === 'Finance') && (
            <div className="space-y-6" id="tab-sales-wrapper">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4" id="sales-header">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950">Sales Logistics (Bookings)</h1>
                  <p className="text-xs text-slate-500">
                    {user.role === 'Seller' 
                      ? 'Secure Seller Portal. You can only view sales logs entered under your credentials.' 
                      : `${user.role} Access. Displaying consolidated sales logs from all active sellers.`}
                  </p>
                </div>
                <div className="flex items-center gap-2" id="sales-export-buttons">
                  <button
                    onClick={() => handleExportSales('print')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-705 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    title="Print PDF of Sales"
                    id="btn-sales-print"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    Print PDF
                  </button>
                  <button
                    onClick={() => handleExportSales('excel')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    title="Export list to Excel"
                    id="btn-sales-excel"
                  >
                    <Download className="w-4 h-4 text-indigo-500" />
                    Excel Export
                  </button>
                </div>
              </div>

              {/* Grid Layout spacing */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="sales-grid">
                
                {/* Sales Ledger Table */}
                <div className="bg-white border border-slate-100 rounded-xl shadow-sm lg:col-span-2 overflow-hidden flex flex-col" id="sales-ledg-card">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3" id="sales-sub-header">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Booked Sales Transactions</span>
                    
                    {/* Filters bar */}
                    <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto" id="sales-filter-row">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">From</span>
                        <input
                          type="date"
                          id="sales-start-date"
                          className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[11px] h-[30px]"
                          value={salesStartDate}
                          onChange={(e) => setSalesStartDate(e.target.value)}
                        />
                        <span className="text-[10px] uppercase font-bold text-slate-400">To</span>
                        <input
                          type="date"
                          id="sales-end-date"
                          className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[11px] h-[30px]"
                          value={salesEndDate}
                          onChange={(e) => setSalesEndDate(e.target.value)}
                        />
                      </div>

                      <select
                        id="sales-payment-filter"
                        className="bg-slate-50 border border-slate-200 text-[11px] rounded px-2 py-1 focus:outline-none h-[30px]"
                        value={paymentOptionFilter}
                        onChange={(e) => setPaymentOptionFilter(e.target.value)}
                      >
                        <option value="All">All Payments</option>
                        <option value="Cash">Cash Only</option>
                        <option value="Transfer">Transfer Only</option>
                        <option value="Loan">Active Loans</option>
                        <option value="Paid Loan">Paid Loans</option>
                      </select>

                      {(salesStartDate || salesEndDate) && (
                        <button
                          onClick={() => { setSalesStartDate(''); setSalesEndDate(''); }}
                          className="text-[10px] text-red-500 hover:underline font-semibold font-mono cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
 
                  <div className="overflow-x-auto" id="sales-table-element">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 font-semibold uppercase text-slate-600 tracking-wider">
                          <th className="p-3">Reference / Date</th>
                          <th className="p-3">Logged Seller</th>
                          <th className="p-3">Client Recipient</th>
                          <th className="p-3">Disbursed Material Spec</th>
                          <th className="p-3 font-mono">Quantity</th>
                          <th className="p-3 font-mono text-right">Invoice Total</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100" id="sales-tbody">
                        {sales
                          .filter(s => paymentOptionFilter === 'All' || getDisplayPaymentMethod(s) === paymentOptionFilter)
                          .filter(s => {
                            if (!salesStartDate && !salesEndDate) return true;
                            const start = salesStartDate ? salesStartDate : '0000-00-00';
                            const end = salesEndDate ? salesEndDate : '9999-12-31';
                            return s.date >= start && s.date <= end;
                          })
                          .map(s => (
                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3">
                                <div className="font-semibold text-indigo-700">TX-SALE-{1000 + s.id}</div>
                                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {s.date}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-900">{s.seller?.name || 'Seller #' + s.sellerId}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{s.seller?.email || 'N/A'}</div>
                              </td>
                              <td className="p-3 text-slate-705 font-medium">{s.customerName}</td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-900">{s.material?.name || s.materialName || 'Material Registry #' + s.materialId}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{s.material?.sku || s.materialSku || 'N/A'}</div>
                              </td>
                              <td className="p-3 font-mono font-semibold text-slate-800">{s.quantity} Units</td>
                              <td className="p-3 font-mono font-bold text-emerald-700 text-right">
                                ${s.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                <span className="text-[10px] block font-semibold uppercase text-slate-400 font-mono tracking-wider">
                                  {getDisplayPaymentMethod(s)}
                                </span>
                                {getDisplayPaymentMethod(s) === 'Transfer' && s.transferBank && (
                                  <span className="text-[9px] block font-normal text-indigo-600 font-sans tracking-wide leading-tight mt-0.5 text-right">
                                    {s.transferBank}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <div className="inline-flex gap-1">
                                  {(user.role === 'Admin' || user.role === 'Finance' || s.sellerId === user.id) && (
                                    <>
                                      <button
                                        onClick={() => startEditSale(s)}
                                        className="p-1 px-2 bg-slate-50 hover:bg-slate-100 text-blue-650 border border-slate-200 hover:border-blue-300 rounded text-[10px] font-semibold cursor-pointer transition-colors"
                                        title="Edit Sale Record"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSale(s)}
                                        className="p-1 text-red-600 hover:bg-red-50 border border-slate-200 rounded hover:border-red-200 cursor-pointer transition-colors flex items-center justify-center h-6 w-6"
                                        title="Delete Sale"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        {sales.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400 font-mono">
                              No client sales cleared under your credentials.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                    {/* Log Sale Transaction Side Form */}
                <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6 animate-fade-in" id="sales-form-box">
                  <div className="flex items-center gap-2 mb-4" id="sales-form-title">
                    <ShoppingCart className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Record Client Transaction</h3>
                  </div>

                  <form className="space-y-3" onSubmit={handleLogSale} id="sale-form-logs">
                    
                    {(user.role === 'Admin' || user.role === 'Finance') && (
                      <div className="space-y-1" id="group-sseller">
                        <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest block">Assign Seller responsible *</label>
                        <select
                          id="sale-select-seller"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          value={newSale.sellerId}
                          onChange={(e) => setNewSale(prev => ({ ...prev, sellerId: e.target.value }))}
                          required
                        >
                          <option value="">-- Choose Seller Account --</option>
                          {users.filter(u => u.role === 'Seller' && u.status === 'active').map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div className="space-y-1" id="group-scustomer">
                      <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Customer Recipient Name</label>
                      <input
                        type="text"
                        id="sale-customer-name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        placeholder="Alliance Aerospace Ltd"
                        value={newSale.customerName}
                        onChange={(e) => setNewSale(prev => ({ ...prev, customerName: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-1" id="group-smaterial">
                      <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Disbursed Material SPEC</label>
                      <select
                        id="sale-select-material"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        value={newSale.materialId}
                        onChange={(e) => setNewSale(prev => ({ ...prev, materialId: e.target.value }))}
                        required
                      >
                        <option value="">-- Choose Import stock SKU --</option>
                        {materials.map(m => (
                          <option key={m.id} value={m.id} disabled={m.quantity === 0}>
                            {m.name} ({m.sku}) — {m.quantity} Avail
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2" id="grid-sale-qty-pm">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Quantity</label>
                        <input
                          type="number"
                          id="sale-quantity"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          placeholder="10"
                          min="1"
                          value={newSale.quantity}
                          onChange={(e) => setNewSale(prev => ({ ...prev, quantity: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Payment Style</label>
                        <select
                          id="sale-payment-method"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          value={newSale.paymentMethod}
                          onChange={(e) => setNewSale(prev => ({ ...prev, paymentMethod: e.target.value as 'Cash' | 'Transfer' | 'Loan' | 'Paid Loan' }))}
                        >
                          <option value="Cash">Cash</option>
                          <option value="Transfer">Bank Transfer</option>
                          <option value="Loan">Loan (Outstanding Balance)</option>
                        </select>
                      </div>
                    </div>

                    {newSale.paymentMethod === 'Transfer' && (
                      <div className="space-y-1 animate-fade-in" id="group-sbank">
                        <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest block">Recipient Ethiopian Bank *</label>
                        <select
                          id="sale-transfer-bank"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          value={newSale.transferBank}
                          onChange={(e) => setNewSale(prev => ({ ...prev, transferBank: e.target.value }))}
                          required
                        >
                          <option value="">-- Choose Ethiopian Bank --</option>
                          <option value="Commercial Bank of Ethiopia (CBE)">Commercial Bank of Ethiopia (CBE)</option>
                          <option value="Awash Bank">Awash Bank</option>
                          <option value="Dashen Bank">Dashen Bank</option>
                          <option value="Bank of Abyssinia">Bank of Abyssinia</option>
                          <option value="Hibret Bank">Hibret Bank</option>
                          <option value="Cooperative Bank of Oromia">Cooperative Bank of Oromia</option>
                          <option value="Zemen Bank">Zemen Bank</option>
                          <option value="Wegagen Bank">Wegagen Bank</option>
                          <option value="Nib International Bank">Nib International Bank</option>
                          <option value="Telebirr (Digital Wallet)">Telebirr (Digital Wallet)</option>
                          <option value="Other Bank">Other Bank / Transfer</option>
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2" id="grid-sale-date-amount">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Invoice ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          id="sale-total-amount"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 font-semibold font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          placeholder="0.00"
                          value={newSale.totalAmount}
                          onChange={(e) => setNewSale(prev => ({ ...prev, totalAmount: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Date</label>
                        <input
                          type="date"
                          id="sale-date"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          value={newSale.date}
                          onChange={(e) => setNewSale(prev => ({ ...prev, date: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-mono text-slate-500 space-y-1" id="pricing-info">
                      <div className="text-indigo-600 font-semibold">Depletion: Creating sale automatically decrements inventory.</div>
                    </div>

                    <button
                      type="submit"
                      id="sale-submit-btn"
                      disabled={loadingAction}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-all uppercase tracking-wider block"
                    >
                      {loadingAction ? 'Processing transaction...' : 'Approve Sale & Drop Stock'}
                    </button>
                  </form>
                </div>                </div>
              </div>
            </div>
          )}


          {/* TAB 4: EXPENSES PANEL (Admin & Finance) */}
          {activeTab === 'expenses' && (user.role === 'Admin' || user.role === 'Finance') && (
            <div className="space-y-6" id="tab-expenses-wrapper">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4" id="expenses-hdr">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950">Company Expense Ledger</h1>
                  <p className="text-xs text-slate-500">logged by Admin or Finance staff.</p>
                </div>
                <div className="flex items-center gap-2" id="expenses-export-buttons">
                  <button
                    onClick={() => handleExportExpenses('print')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-705 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    title="Print PDF of Expenses"
                    id="btn-expenses-print"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    Print PDF
                  </button>
                  <button
                    onClick={() => handleExportExpenses('excel')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    title="Export list to Excel"
                    id="btn-expenses-excel"
                  >
                    <Download className="w-4 h-4 text-indigo-500" />
                    Excel Export
                  </button>
                </div>
              </div>

              {/* Grid 3 Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="exp-grid-box">
                
                {/* Expenses List */}
                <div className="bg-white border border-slate-100 rounded-xl shadow-sm lg:col-span-2 overflow-hidden flex flex-col" id="exp-ledger-card">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" id="exp-card-header">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Payout Records ({expenses.length})</span>
                    
                    {/* Date range selection */}
                    <div className="flex items-center gap-1.5" id="exp-date-filters">
                      <span className="text-[10px] uppercase font-bold text-slate-400">From</span>
                      <input
                        type="date"
                        id="exp-start-date"
                        className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[11px] h-[28px]"
                        value={expenseStartDate}
                        onChange={(e) => setExpenseStartDate(e.target.value)}
                      />
                      <span className="text-[10px] uppercase font-bold text-slate-400">To</span>
                      <input
                        type="date"
                        id="exp-end-date"
                        className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[11px] h-[28px]"
                        value={expenseEndDate}
                        onChange={(e) => setExpenseEndDate(e.target.value)}
                      />
                      {(expenseStartDate || expenseEndDate) && (
                        <button
                          onClick={() => { setExpenseStartDate(''); setExpenseEndDate(''); }}
                          className="text-[10px] text-red-500 hover:underline font-semibold font-mono cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto" id="exp-table">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 font-semibold uppercase text-slate-600 tracking-wider">
                          <th className="p-3">Reference ID</th>
                          <th className="p-3">Expense Category</th>
                          <th className="p-3">Logged By Staff</th>
                          <th className="p-3">Payment Date</th>
                          <th className="p-3 font-mono text-right">Sum Disbursed</th>
                          <th className="p-3 text-right">Ledger Options</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100" id="expenses-tbody">
                        {expenses
                          .filter(e => {
                            if (!expenseStartDate && !expenseEndDate) return true;
                            const start = expenseStartDate ? expenseStartDate : '0000-00-00';
                            const end = expenseEndDate ? expenseEndDate : '9999-12-31';
                            return e.date >= start && e.date <= end;
                          })
                          .map(e => (
                            <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3 font-semibold text-slate-600">TX-EXP-{1000 + e.id}</td>
                              <td className="p-3 font-semibold text-slate-900">{e.category}</td>
                              <td className="p-3 text-slate-650">
                                <div className="font-semibold text-slate-800">{e.loggedBy?.name || 'User #' + e.loggedById}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{e.loggedBy?.email || ''}</div>
                              </td>
                              <td className="p-3 text-slate-500 font-mono">{e.date}</td>
                              <td className="p-3 font-mono font-bold text-red-600 text-right">
                                -${e.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3 text-right whitespace-nowrap">
                                <div className="inline-flex gap-1.5 justify-end" id={`expense-actions-${e.id}`}>
                                  <button
                                    onClick={() => startEditExpense(e)}
                                    className="px-2 py-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors cursor-pointer"
                                    title="Edit Expense Record"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteExpense(e)}
                                    className="p-1 text-red-650 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded transition-colors cursor-pointer flex items-center justify-center w-6 h-6"
                                    title="Delete Expense Record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        {expenses.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-mono">
                              No company expense depletions reported.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Expense Entry Form */}
                <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6" id="add-expense-card-form">
                  <div className="flex items-center gap-2 mb-4" id="exp-add-header">
                    <Coins className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Record Bank Payout</h3>
                  </div>

                  <form className="space-y-4" onSubmit={handleLogExpense} id="company-expense-form">
                    <div className="space-y-1" id="group-ecategory">
                      <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest block">Expense Category Name</label>
                      <input
                        type="text"
                        id="exp-input-category"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        placeholder="Warehouse Lease / Freight Taxes"
                        value={newExpense.category}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-1" id="group-eamount">
                      <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest block">Payout Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        id="exp-input-amount"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        placeholder="500.00"
                        min="1"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-1" id="group-edate">
                      <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest block">Disbursed Date</label>
                      <input
                        type="date"
                        id="exp-input-date"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      id="exp-submit-btn"
                      disabled={loadingAction}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-all uppercase tracking-wider block"
                    >
                      {loadingAction ? 'Submitting bills...' : 'Record Company Payout'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}


          {/* TAB 5: FINANCIAL REPORTS PANEL (Admin & Finance) */}
          {activeTab === 'reports' && (user.role === 'Admin' || user.role === 'Finance') && (
            <div className="space-y-6 animate-fade-in" id="tab-reports-wrapper">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4" id="reports-header-box">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950">Company Financial Performance</h1>
                  <p className="text-xs text-slate-500">Gross metrics</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap" id="reports-action-buttons">
                  <button
                    onClick={() => handleExportReports('print')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-705 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    title="Print PDF report"
                    id="btn-reports-print"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    Print PDF Report
                  </button>
                  <button
                    onClick={() => handleExportReports('excel')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    title="Export report to Excel"
                    id="btn-reports-excel"
                  >
                    <Download className="w-4 h-4 text-indigo-500" />
                    Excel Export
                  </button>
                  <button
                    onClick={() => { fetchFinancials(); setApiSuccess('Financial report ledger updated.'); }}
                    className="px-3 py-1.5 bg-slate-900 text-white hover:bg-indigo-700 text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer font-semibold uppercase tracking-wider"
                    id="btn-refresh-analytic-ledger"
                  >
                    <RefreshCw className="w-4 h-4 animate-spin-slow" />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Date Range Selector Box */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-4" id="reports-date-filter-panel">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
                  <div className="space-y-1 flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Report Start Date</label>
                    <input
                      type="date"
                      id="report-start-date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Report End Date</label>
                    <input
                      type="date"
                      id="report-end-date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      fetchFinancials(reportStartDate, reportEndDate);
                      setApiSuccess(`Financial metrics filtered from ${reportStartDate || 'inception'} to ${reportEndDate || 'present'}.`);
                    }}
                    id="btn-reports-apply-filter"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    Apply Filter
                  </button>
                  <button
                    onClick={() => {
                      setReportStartDate('');
                      setReportEndDate('');
                      fetchFinancials('', '');
                      setApiSuccess('Financial report date filter cleared.');
                    }}
                    id="btn-reports-clear-filter"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    Clear Range
                  </button>
                </div>
              </div>

              {/* Master Balance Sheet Top Row Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" id="report-financial-boxes">
                
                {/* 1. Gross Revenue Box */}
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-2 relative overflow-hidden" id="box-revenue">
                  <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                  <div className="flex items-center justify-between" id="row-revenue">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Gross Income</span>
                    <div className="p-1 rounded bg-indigo-50 font-semibold" id="icon-container-revenue">
                      <TrendingUp className="w-4 h-4 text-indigo-700" />
                    </div>
                  </div>
                  <div className="text-xl font-bold text-slate-900 font-mono" id="val-revenue">
                    ${masterReport?.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                  </div>
                  <p className="text-[10px] text-slate-500">Total sales plus repaid loans in range.</p>
                </div>

                {/* 2. Materials COGS Cost Basis Box */}
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-2 relative overflow-hidden" id="box-cogs">
                  <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
                  <div className="flex items-center justify-between" id="row-cogs">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Cost of Goods Sold (COGS)</span>
                    <div className="p-1 rounded bg-amber-50" id="icon-container-cogs">
                      <Package className="w-4 h-4 text-amber-700" />
                    </div>
                  </div>
                  <div className="text-xl font-bold text-slate-900 font-mono" id="val-cogs">
                    ${masterReport?.cogs.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                  </div>
                  <p className="text-[10px] text-slate-500">Total import cost price of Materials sold.</p>
                </div>

                {/* 3. Outstanding Loans Box */}
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-2 relative overflow-hidden" id="box-outstanding-loans">
                  <div className="absolute top-0 left-0 w-full h-1 bg-violet-500"></div>
                  <div className="flex items-center justify-between" id="row-outstanding-loans">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Client Loans</span>
                    <div className="p-1 rounded bg-violet-50 animate-pulse" id="icon-container-outstanding-loans">
                      <CreditCard className="w-4 h-4 text-violet-700" />
                    </div>
                  </div>
                  <div className="text-xl font-bold text-slate-900 font-mono" id="val-outstanding-loans">
                    ${masterReport?.outstandingLoans?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                  </div>
                  <p className="text-[10px] text-slate-500">Total remaining unpaid client loan balance.</p>
                </div>

                {/* 3b. Company Outstanding Loans Box */}
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-2 relative overflow-hidden" id="box-outstanding-company-loans">
                  <div className="absolute top-0 left-0 w-full h-1 bg-teal-500"></div>
                  <div className="flex items-center justify-between" id="row-outstanding-company-loans">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Company Loans</span>
                    <div className="p-1 rounded bg-teal-50 animate-pulse" id="icon-container-outstanding-company-loans">
                      <Building2 className="w-4 h-4 text-teal-700" />
                    </div>
                  </div>
                  <div className="text-xl font-bold text-slate-900 font-mono" id="val-outstanding-company-loans">
                    ${masterReport?.outstandingCompanyLoans?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                  </div>
                  <p className="text-[10px] text-slate-500">Total remaining unpaid company debt balance.</p>
                </div>

                {/* 4. Company expenses */}
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-2 relative overflow-hidden" id="box-expenses">
                  <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                  <div className="flex items-center justify-between" id="row-expenses">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Company Expenses</span>
                    <div className="p-1 rounded bg-rose-50" id="icon-container-expenses">
                      <Coins className="w-4 h-4 text-rose-700" />
                    </div>
                  </div>
                  <div className="text-xl font-bold text-slate-900 font-mono" id="val-expenses">
                    ${masterReport?.companyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                  </div>
                  <p className="text-[10px] text-slate-500">Utilities, declaration fees, warehouse rents.</p>
                </div>

                {/* 5. Net Profit Margins */}
                {masterReport && (
                  <div className={`border rounded-xl p-5 shadow-sm space-y-2 relative overflow-hidden ${
                    masterReport.netProfit >= 0 ? 'bg-indigo-950 text-white border-indigo-900' : 'bg-red-950 text-white border-red-900'
                  }`} id="box-netprofit">
                    <div className="flex items-center justify-between" id="row-netprofit">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Net Profit</span>
                      <div className={`p-1 rounded text-xs font-bold ${
                        masterReport.netProfit >= 0 ? 'bg-indigo-800 text-indigo-200' : 'bg-red-800 text-red-200'
                      }`} id="badge-profit">
                        {masterReport.netProfit >= 0 ? 'Surplus' : 'Deficit'}
                      </div>
                    </div>
                    <div className="text-2xl font-bold font-mono" id="val-netprofit">
                      ${masterReport.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[9px] text-indigo-300 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Net profit = Rev - COGS - Expenses
                    </div>
                  </div>
                )}
              </div>

              {/* Grid 2 Columns: Book asset values on Left, Ranked sellers list on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8" id="financials-sub-grid">
                
                {/* Book value of remaining inventory asset */}
                <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6 space-y-4" id="inv-capital-value-box">
                  <div className="flex items-center justify-between border-b pb-3" id="inv-cap-header">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Inventory Asset Book Capital</h4>
                      <p className="text-[11px] text-slate-400">Total value of physical materials staying in warehouse.</p>
                    </div>
                    <span className="p-2 rounded bg-indigo-50 block" id="badge-icon-capital">
                      <Building2 className="w-5 h-5 text-indigo-700" />
                    </span>
                  </div>

                   {user.role === 'Admin' &&
                  <div className="flex items-center justify-between py-2" id="inv-cap-row">
                    <span className="text-sm font-semibold text-slate-700">Toll Remaining Asset Value</span>
                    <span className="text-lg font-bold text-slate-950 font-mono">
                      ${masterReport?.inventoryAssetValue.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                    </span>
                  </div> }

                  <div className="space-y-2 border-t pt-3" id="inv-cap-spec">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Warehouse Stock Splitting</span>
                    <div className="space-y-2" id="inv-splitting-container">
                      {materials.map(m => {
                        const costTotal = m.quantity * m.costPrice;
                        const matPercent = masterReport && masterReport.inventoryAssetValue > 0 
                          ? Math.round((costTotal / masterReport.inventoryAssetValue) * 100) 
                          : 0;

                        return (
                          <div key={m.id} className="space-y-1 text-xs" id={`split-item-${m.id}`}>
                            <div className="flex justify-between items-center text-slate-700 font-medium">
                              <span>{m.name} ({m.quantity} units)</span>
                              <span className="font-mono">${costTotal.toFixed(2)} ({matPercent}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${matPercent}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Seller performance rank charts */}
                <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6 space-y-4" id="ranked-seller-performance-box">
                  <div className="border-b pb-3" id="seller-perf-header">
                    <h4 className="font-bold text-slate-900 text-sm">Seller Performance rankings</h4>
                  </div>

                  <div className="space-y-3" id="ranked-seller-container">
                    {sellerPerformance.map((seller, index) => {
                      const totalSum = seller.totalSalesAmount;
                      const profitSum = seller.profitContribution;
                      
                      return (
                        <div key={seller.sellerId} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex flex-col gap-2" id={`perf-seller-${seller.sellerId}`}>
                          <div className="flex items-center gap-3">
                            {/* Rank badge */}
                            <div className={`w-8 h-8 rounded-full font-bold font-mono text-xs flex items-center justify-center shrink-0 ${
                              index === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              index === 1 ? 'bg-slate-200 text-slate-700 border border-slate-350' :
                              'bg-slate-100 text-slate-550'
                            }`} id={`badge-rank-${index}`}>
                              #{index + 1}
                            </div>

                            <div className="flex-1 min-w-0" id={`perf-context-seller-${seller.sellerId}`}>
                              <div className="font-semibold text-slate-900 text-xs truncate flex items-center gap-1.5">
                                {seller.name}
                                <span className={`w-1.5 h-1.5 rounded-full inline-block ${seller.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate font-mono">{seller.email}</div>
                            </div>

                            <div className="text-right flex flex-col items-end" id={`perf-metrics-seller-${seller.sellerId}`}>
                              <div className="font-semibold font-mono text-xs text-slate-900">${totalSum.toLocaleString('en-US', { maximumFractionDigits: 0 })} Sales</div>
                            </div>

                            {/* Dropdown Toggle details */}
                            <div className="pl-1">
                              <button
                                type="button"
                                onClick={() => toggleSellerExpand(seller.sellerId)}
                                className="px-2 py-1 text-[10px] font-semibold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded transition-colors cursor-pointer flex items-center gap-1 min-w-[70px] justify-center"
                                title="Show materials, quantities and prices sold"
                              >
                                <span>{expandedSellers[seller.sellerId] ? 'Hide' : 'Details'}</span>
                                <svg
                                  className={`w-3 h-3 transition-transform ${expandedSellers[seller.sellerId] ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {expandedSellers[seller.sellerId] && (
                            <div className="pt-2.5 border-t border-slate-200/80 animate-fade-in text-[11px]" id={`perf-seller-details-${seller.sellerId}`}>
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                                <span>Sold Materials Breakdown ({seller.sales?.length || 0})</span>
                                <span className="text-[9px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">Sales Track Record</span>
                              </div>
                              {seller.sales && seller.sales.length > 0 ? (
                                <div className="bg-white rounded-lg border border-slate-100 divide-y divide-slate-100 overflow-hidden shadow-sm">
                                  {seller.sales.map((item) => (
                                    <div key={item.id} className="p-2 flex justify-between items-center hover:bg-slate-50/40 transition-colors">
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-slate-800">{item.materialName}</span>
                                        <span className="text-[9px] font-mono text-slate-400">SKU: {item.materialSku} • Date: {item.date}</span>
                                      </div>
                                      <div className="text-right flex flex-col items-end">
                                        <span className="font-mono text-slate-900 font-bold">${item.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        <span className="text-[9px] font-mono text-slate-500">Quantity: {item.quantity}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400 font-mono italic p-2 bg-white rounded border border-slate-150 text-center">
                                  No individual sold material transactions found for this timeframe.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {sellerPerformance.length === 0 && (
                      <div className="p-6 text-center text-slate-400 italic font-mono text-xs">
                        No registered export transactions or seller agents detected.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* TAB 6: LOAN MANAGEMENT PANEL (Finance/Admin) */}
          {activeTab === 'loans' && (user.role === 'Admin' || user.role === 'Finance') && (
            <div className="space-y-6 animate-fade-in" id="tab-loans-wrapper">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4" id="loans-header-box">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950">Company & Client loan Records</h1>
                  <p className="text-xs text-slate-500">Track raw materials taken as credit by clients and loans borrowed by our company.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap" id="loans-header-actions">
                  <button
                    onClick={handlePrintLoans}
                    className="flex items-center gap-1.5 p-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer"
                    id="btn-print-loans-pdf"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Client Loan Records
                  </button>
                  <button
                    onClick={handlePrintCompanyLoans}
                    className="flex items-center gap-1.5 p-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer"
                    id="btn-print-company-loans-pdf"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Company Loan Records
                  </button>
                </div>
              </div>

              {/* Loans summary cards row */}
              {(() => {
                const clientLoanTrxs = sales.filter(s => {
                  if (user.role === 'Seller' && s.sellerId !== user.id) return false;
                  if (s.paymentMethod !== 'Loan') return false;
                  if (clientLoansStartDate && s.date < clientLoansStartDate) return false;
                  if (clientLoansEndDate && s.date > clientLoansEndDate) return false;
                  return true;
                });
                const totalClientLoans = clientLoanTrxs.reduce((sum, s) => sum + s.totalAmount, 0);
                const totalClientRepaid = clientLoanTrxs.reduce((sum, s) => sum + (s.repaidAmount || 0), 0);
                const clientOutstanding = totalClientLoans - totalClientRepaid;

                const filteredCompanyLoansForKPI = companyLoans.filter(l => {
                  if (companyLoansStartDate && l.date < companyLoansStartDate) return false;
                  if (companyLoansEndDate && l.date > companyLoansEndDate) return false;
                  return true;
                });
                const totalCompanyBorrowed = filteredCompanyLoansForKPI.reduce((sum, l) => sum + l.amount, 0);
                const totalCompanyRepaid = filteredCompanyLoansForKPI.reduce((sum, l) => sum + (l.repaidAmount || 0), 0);
                const companyOutstanding = totalCompanyBorrowed - totalCompanyRepaid;

                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="loans-summary-boxes">
                    {/* Client Loans Issued */}
                    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-1 relative overflow-hidden" id="box-loans-issued">
                      <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Total Client Loans (Receivable)</span>
                      <div className="text-xl font-bold text-slate-900 font-mono">
                        ${totalClientLoans.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-[9px] text-slate-400">Total credit lines extended to clients.</p>
                    </div>

                    {/* Client Loans Outstanding */}
                    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-1 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Total Remaining Client Loan</span>
                      <div className={`text-xl font-bold font-mono ${clientOutstanding > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                        ${clientOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-[9px] text-slate-400">Remaining receivable debt from sales.</p>
                    </div>

                    {/* Company Loans Borrowed */}
                    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-1 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Total Company Borrowed (Payable)</span>
                      <div className="text-xl font-bold text-slate-900 font-mono">
                        ${totalCompanyBorrowed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-[9px] text-slate-400">Total capital borrowed from sources.</p>
                    </div>

                    {/* Company Outstanding Balance */}
                    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-1 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Total Remaining Company loan</span>
                      <div className={`text-xl font-bold font-mono ${companyOutstanding > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                        ${companyOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-[9px] text-slate-400">Remaining liability to corporate lenders.</p>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tables Column (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Table 1: Client Loans (Materials sold by loan) */}
                  <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden" id="loans-table-container">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        Client Loans (Receivables)
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] uppercase font-bold text-slate-400">From</span>
                          <input
                            type="date"
                            className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] h-[26px]"
                            value={clientLoansStartDate}
                            onChange={(e) => setClientLoansStartDate(e.target.value)}
                          />
                          <span className="text-[9px] uppercase font-bold text-slate-400">To</span>
                          <input
                            type="date"
                            className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] h-[26px]"
                            value={clientLoansEndDate}
                            onChange={(e) => setClientLoansEndDate(e.target.value)}
                          />
                          {(clientLoansStartDate || clientLoansEndDate) && (
                            <button
                              onClick={() => { setClientLoansStartDate(''); setClientLoansEndDate(''); }}
                              className="text-[9px] text-red-500 hover:underline font-semibold"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                          {sales.filter(s => {
                            if (user.role === 'Seller' && s.sellerId !== user.id) return false;
                            if (s.paymentMethod !== 'Loan') return false;
                            if (clientLoansStartDate && s.date < clientLoansStartDate) return false;
                            if (clientLoansEndDate && s.date > clientLoansEndDate) return false;
                            return true;
                          }).length} Records
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase text-[10px] tracking-wider font-sans">
                            <th className="p-3">Client (Recipient)</th>
                            <th className="p-3">Material Disbursed</th>
                            <th className="p-3 text-right">Units</th>
                            <th className="p-3 text-right">Loan Amount</th>
                            <th className="p-3 text-right">Repaid Sum</th>
                            <th className="p-3 text-right">Balance Due</th>
                            <th className="p-3 text-center">Date</th>
                            <th className="p-3 text-center">Controls</th>
                            <th className="p-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sales.filter(s => {
                            if (user.role === 'Seller' && s.sellerId !== user.id) return false;
                            if (s.paymentMethod !== 'Loan') return false;
                            if (clientLoansStartDate && s.date < clientLoansStartDate) return false;
                            if (clientLoansEndDate && s.date > clientLoansEndDate) return false;
                            return true;
                          }).map((s) => {
                            const outstanding = s.totalAmount - (s.repaidAmount || 0);
                            const isSettled = outstanding === 0;

                            return (
                              <tr key={s.id} className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-3 font-semibold text-slate-950">
                                  {s.customerName}
                                  <div className="text-[9px] font-normal text-slate-400">By: {s.seller?.name || `Agent #${s.sellerId}`}</div>
                                </td>
                                <td className="p-3">
                                  <span className="font-semibold text-slate-800">{s.materialName || 'Uncoded Spec'}</span>
                                  <div className="text-[9px] font-mono text-slate-500">{s.materialSku || 'N/A'}</div>
                                </td>
                                <td className="p-3 text-right font-mono text-slate-700 font-semibold">
                                  {s.quantity.toLocaleString('en-US')}
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-slate-900">
                                  ${s.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-3 text-right font-mono text-emerald-600 font-semibold">
                                  ${(s.repaidAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className={`p-3 text-right font-mono font-bold ${isSettled ? 'text-slate-400 line-through' : 'text-rose-600'}`}>
                                  ${outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-3 text-center font-mono text-slate-500 whitespace-nowrap">
                                  {s.date}
                                </td>
                                <td className="p-3">
                                  {!isSettled ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <input
                                        type="number"
                                        placeholder="Amount"
                                        step="0.01"
                                        min="0.01"
                                        max={outstanding}
                                        value={repayInputs[s.id] || ''}
                                        onChange={(e) => setRepayInputs(prev => ({ ...prev, [s.id]: e.target.value }))}
                                        className="w-16 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-800 text-[10px] font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                      />
                                      <button
                                        onClick={() => handleRepayLoan(s.id, Number(repayInputs[s.id] || 0))}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-1.5 py-0.5 text-[9px] rounded uppercase tracking-wider cursor-pointer"
                                      >
                                        Repay
                                      </button>
                                      <button
                                        onClick={() => handleRepayLoan(s.id, outstanding)}
                                        className="bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 text-[9px] rounded uppercase tracking-wider cursor-pointer"
                                        title="Settle fully"
                                      >
                                        Fully
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic flex justify-center">Settled</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <div className="inline-flex gap-1 justify-center w-full">
                                    {(user.role === 'Admin' || user.role === 'Finance' || s.sellerId === user.id) && (
                                      <>
                                        <button
                                          onClick={() => startEditSale(s)}
                                          className="p-1 px-1.5 bg-slate-50 hover:bg-slate-100 text-blue-650 border border-slate-200 rounded text-[9px] font-semibold cursor-pointer"
                                        >
                                          Edit
                                        </button>
                                        {isSettled && (
                                          <button
                                            onClick={() => handleDeleteLoanOnly(s)}
                                            className="p-1 text-red-650 hover:bg-red-50 border border-slate-200 rounded cursor-pointer h-5 w-5 flex items-center justify-center"
                                            title="Remove Settled Loan from Registry"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {sales.filter(s => {
                            if (user.role === 'Seller' && s.sellerId !== user.id) return false;
                            if (s.paymentMethod !== 'Loan') return false;
                            if (clientLoansStartDate && s.date < clientLoansStartDate) return false;
                            if (clientLoansEndDate && s.date > clientLoansEndDate) return false;
                            return true;
                          }).length === 0 && (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-slate-400 italic font-mono text-xs">
                                No registered raw material client loans found for the selected date range.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Table 2: Company Loans (Money our company borrowed from different sources) */}
                  <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-500" />
                        Company Loans (Payables)
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] uppercase font-bold text-slate-400">From</span>
                          <input
                            type="date"
                            className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] h-[26px]"
                            value={companyLoansStartDate}
                            onChange={(e) => setCompanyLoansStartDate(e.target.value)}
                          />
                          <span className="text-[9px] uppercase font-bold text-slate-400">To</span>
                          <input
                            type="date"
                            className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] h-[26px]"
                            value={companyLoansEndDate}
                            onChange={(e) => setCompanyLoansEndDate(e.target.value)}
                          />
                          {(companyLoansStartDate || companyLoansEndDate) && (
                            <button
                              onClick={() => { setCompanyLoansStartDate(''); setCompanyLoansEndDate(''); }}
                              className="text-[9px] text-red-500 hover:underline font-semibold"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                          {companyLoans.filter(l => {
                            if (companyLoansStartDate && l.date < companyLoansStartDate) return false;
                            if (companyLoansEndDate && l.date > companyLoansEndDate) return false;
                            return true;
                          }).length} Records
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase text-[10px] tracking-wider font-sans">
                            <th className="p-3">Lender (Source)</th>
                            <th className="p-3 text-right">Amount Borrowed</th>
                            <th className="p-3 text-right">Repaid Sum</th>
                            <th className="p-3 text-right">Balance Due</th>
                            <th className="p-3 text-center">Date Taken</th>
                            <th className="p-3 text-center">Repayment Controls</th>
                            <th className="p-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {companyLoans.filter(l => {
                            if (companyLoansStartDate && l.date < companyLoansStartDate) return false;
                            if (companyLoansEndDate && l.date > companyLoansEndDate) return false;
                            return true;
                          }).map((l) => {
                            const outstanding = l.amount - (l.repaidAmount || 0);
                            const isSettled = outstanding === 0;

                            return (
                              <tr key={l.id} className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-3 font-semibold text-slate-950">
                                  {l.lender}
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-slate-900">
                                  ${l.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-3 text-right font-mono text-emerald-600 font-semibold">
                                  ${(l.repaidAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className={`p-3 text-right font-mono font-bold ${isSettled ? 'text-slate-400 line-through' : 'text-rose-600'}`}>
                                  ${outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-3 text-center font-mono text-slate-500 whitespace-nowrap">
                                  {l.date}
                                </td>
                                <td className="p-3">
                                  {!isSettled ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <input
                                        type="number"
                                        placeholder="Amount"
                                        step="0.01"
                                        min="0.01"
                                        max={outstanding}
                                        value={repayAmounts[l.id] || ''}
                                        onChange={(e) => setRepayAmounts(prev => ({ ...prev, [l.id]: e.target.value }))}
                                        className="w-16 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-800 text-[10px] font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                      />
                                      <button
                                        onClick={() => handleRepayCompanyLoan(l.id, Number(repayAmounts[l.id] || 0))}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-1.5 py-0.5 text-[9px] rounded uppercase tracking-wider cursor-pointer"
                                      >
                                        Repay
                                      </button>
                                      <button
                                        onClick={() => handleRepayCompanyLoan(l.id, outstanding)}
                                        className="bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-700 font-bold px-1.5 py-0.5 text-[9px] rounded uppercase tracking-wider cursor-pointer"
                                        title="Settle fully"
                                      >
                                        Fully
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic flex justify-center">Settled</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <div className="inline-flex gap-1 justify-center w-full">
                                    <button
                                      onClick={() => startEditCompanyLoan(l)}
                                      className="p-1 px-1.5 bg-slate-50 hover:bg-slate-100 text-blue-650 border border-slate-200 rounded text-[9px] font-semibold cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                    {isSettled && (
                                      <button
                                        onClick={() => handleDeleteCompanyLoan(l)}
                                        className="p-1 text-red-650 hover:bg-red-50 border border-slate-200 rounded cursor-pointer h-5 w-5 flex items-center justify-center"
                                        title="Delete Settled Company Loan Record"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {companyLoans.filter(l => {
                            if (companyLoansStartDate && l.date < companyLoansStartDate) return false;
                            if (companyLoansEndDate && l.date > companyLoansEndDate) return false;
                            return true;
                          }).length === 0 && (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-400 italic font-mono text-xs">
                                No corporate company borrowings or loans found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* Form Column (1/3 width) */}
                <div className="space-y-6">
                  <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-emerald-500" />
                        Record Company Loan
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Log new money borrowed from external lenders or banking sources.</p>
                    </div>

                    <form onSubmit={handleCreateCompanyLoan} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Lender / Source *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Commercial Bank of Ethiopia"
                          value={newLender}
                          onChange={(e) => setNewLender(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Loan Amount (USD) *</label>
                        <input
                          type="number"
                          required
                          placeholder="0.00"
                          step="any"
                          value={newLoanAmount}
                          onChange={(e) => setNewLoanAmount(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Date Taken *</label>
                        <input
                          type="date"
                          required
                          value={newLoanDate}
                          onChange={(e) => setNewLoanDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loadingAction}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition-all hover:shadow cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {loadingAction ? 'Recording...' : 'Record Company Loan'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* EDIT SALES EVENT MODAL */}
        {editingSale && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" id="edit-sale-modal">
            <div className="bg-white border border-slate-100 rounded-xl shadow-xl w-full max-w-sm overflow-hidden" id="edit-sale-modal-content">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-indigo-600" />
                  Edit Sale TX-SALE-{1000 + editingSale.id}
                </h3>
                <button onClick={() => setEditingSale(null)} className="text-slate-450 hover:text-slate-600 text-xs font-bold cursor-pointer">✕</button>
              </div>
              <form onSubmit={handleSaveSaleEdit} className="p-5 space-y-4">
                {editingSale.paymentMethod === 'Loan' ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Total Loan Amount (USD) *</label>
                      <input
                        type="number"
                        step="any"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800"
                        value={editTotalAmount}
                        onChange={(e) => setEditTotalAmount(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Repaid Sum (USD) *</label>
                      <input
                        type="number"
                        step="any"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800"
                        value={editRepaidAmount}
                        onChange={(e) => setEditRepaidAmount(e.target.value)}
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Recipient Client Name *</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800"
                        value={editCustomerName}
                        onChange={(e) => setEditCustomerName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Qty Sold *</label>
                        <input
                          type="number"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Total (USD) *</label>
                        <input
                          type="number"
                          step="any"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800"
                          value={editTotalAmount}
                          onChange={(e) => setEditTotalAmount(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Payment Basis *</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800"
                          value={editPaymentMethod}
                          onChange={(e) => setEditPaymentMethod(e.target.value as 'Cash' | 'Transfer' | 'Loan' | 'Paid Loan')}
                        >
                          <option value="Cash">Cash</option>
                          <option value="Transfer">Transfer</option>
                          <option value="Loan">Loan</option>
                          <option value="Paid Loan">Paid Loan</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Invoice Date *</label>
                        <input
                          type="date"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {editPaymentMethod === 'Transfer' && (
                      <div className="space-y-1 animate-fade-in">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Ethiopian Transfer Bank *</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800"
                          value={editTransferBank}
                          onChange={(e) => setEditTransferBank(e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingSale(null)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingAction}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer font-sans"
                  >
                    {loadingAction ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT USER DETAILS MODAL */}
        {editingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" id="edit-user-modal">
            <div className="bg-white border border-slate-100 rounded-xl shadow-xl w-full max-w-sm overflow-hidden" id="edit-user-modal-content">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <span className="p-1 bg-indigo-50 text-indigo-700 rounded"><Users className="w-4 h-4" /></span>
                  Edit Staff Member
                </h3>
                <button onClick={() => setEditingUser(null)} className="text-slate-450 hover:text-slate-600 text-xs font-bold cursor-pointer">✕</button>
              </div>
              <form onSubmit={handleSaveUserEdit} className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Full Name *</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800"
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Username / Email *</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800"
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Update Password (Blank to keep current)</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800 animate-fade-in"
                    value={editUserPassword}
                    onChange={(e) => setEditUserPassword(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Role *</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800"
                      value={editUserRole}
                      onChange={(e) => setEditUserRole(e.target.value as 'Admin' | 'Finance' | 'Seller')}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Finance">Finance</option>
                      <option value="Seller">Seller</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Status *</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800"
                      value={editUserStatus}
                      onChange={(e) => setEditUserStatus(e.target.value as 'active' | 'inactive')}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingAction}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer font-sans"
                  >
                    {loadingAction ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT EXPENSE LEDGER RECORD MODAL */}
        {editingExpense && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" id="edit-expense-modal">
            <div className="bg-white border border-slate-100 rounded-xl shadow-xl w-full max-w-sm overflow-hidden" id="edit-expense-modal-content">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <span className="p-1 bg-indigo-50 text-indigo-700 rounded"><Coins className="w-4 h-4 shrink-0 text-indigo-600" /></span>
                  Edit Expense Category
                </h3>
                <button onClick={() => setEditingExpense(null)} className="text-slate-450 hover:text-slate-600 text-xs font-bold cursor-pointer">✕</button>
              </div>
              <form onSubmit={handleSaveExpenseEdit} className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Category Name *</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800"
                    value={editExpenseCategory}
                    onChange={(e) => setEditExpenseCategory(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Outlay Amount ($ USD) *</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800"
                    value={editExpenseAmount}
                    onChange={(e) => setEditExpenseAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Payment Date *</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800"
                    value={editExpenseDate}
                    onChange={(e) => setEditExpenseDate(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingExpense(null)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingAction}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer font-sans"
                  >
                    {loadingAction ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT COMPANY LOAN MODAL */}
        {editingCompanyLoan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" id="edit-company-loan-modal">
            <div className="bg-white border border-slate-100 rounded-xl shadow-xl w-full max-w-sm overflow-hidden" id="edit-company-loan-modal-content">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <span className="p-1 bg-emerald-50 text-emerald-700 rounded"><Building2 className="w-4 h-4 shrink-0" /></span>
                  Edit Company Loan
                </h3>
                <button onClick={() => setEditingCompanyLoan(null)} className="text-slate-450 hover:text-slate-600 text-xs font-bold cursor-pointer">✕</button>
              </div>
              <form onSubmit={handleSaveCompanyLoanEdit} className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Lender / Source Name *</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800"
                    value={editLender}
                    onChange={(e) => setEditLender(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Total Loan Amount ($ USD) *</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800"
                    value={editLoanAmount}
                    onChange={(e) => setEditLoanAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Repaid Sum ($ USD) *</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800"
                    value={editLoanRepaidAmount}
                    onChange={(e) => setEditLoanRepaidAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest block">Date Taken *</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800"
                    value={editLoanDate}
                    onChange={(e) => setEditLoanDate(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingCompanyLoan(null)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingAction}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer font-sans"
                  >
                    {loadingAction ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
