import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

// Initialize Sequelize with SQLite database stored in the project root (or /tmp on Vercel)
const dbFilename = process.env.VERCEL ? '/tmp/database.sqlite' : path.join(process.cwd(), 'database.sqlite');

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbFilename,
  logging: false, // Turn off query logs in console for readable output
  dialectOptions: {
    // Wait up to 10 seconds for locks to clear before throwing SQLITE_BUSY
    busyTimeout: 10000,
  },
});

// User model definition
export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: 'Admin' | 'Finance' | 'Seller';
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}
export interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public passwordHash!: string;
  public role!: 'Admin' | 'Finance' | 'Seller';
  public status!: 'active' | 'inactive';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Method to check password validity
  public validPassword(password: string): boolean {
    return bcrypt.compareSync(password, this.passwordHash);
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('Admin', 'Finance', 'Seller'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  }
);

// Material (Inventory Item) model definition
export interface MaterialAttributes {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  costPrice: number;
  supplier: string;
  importDate: string;
  restockDate?: string | null;
}
export interface MaterialCreationAttributes extends Optional<MaterialAttributes, 'id'> {}

export class Material extends Model<MaterialAttributes, MaterialCreationAttributes> implements MaterialAttributes {
  public id!: number;
  public name!: string;
  public sku!: string;
  public quantity!: number;
  public costPrice!: number;
  public supplier!: string;
  public importDate!: string;
  public restockDate!: string | null;
}

Material.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    costPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    supplier: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    importDate: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    restockDate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Material',
    tableName: 'materials',
  }
);

// Sale model definition
export interface SaleAttributes {
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
}
export interface SaleCreationAttributes extends Optional<SaleAttributes, 'id'> {}

export class Sale extends Model<SaleAttributes, SaleCreationAttributes> implements SaleAttributes {
  public id!: number;
  public sellerId!: number;
  public customerName!: string;
  public materialId!: number | null;
  public materialName!: string | null;
  public materialSku!: string | null;
  public quantity!: number;
  public totalAmount!: number;
  public paymentMethod!: 'Cash' | 'Transfer' | 'Loan' | 'Paid Loan';
  public transferBank!: string | null;
  public date!: string;
  public repaidAmount!: number;
}

Sale.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    materialId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'materials',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    materialName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    materialSku: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM('Cash', 'Transfer', 'Loan', 'Paid Loan'),
      allowNull: false,
    },
    transferBank: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    repaidAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Sale',
    tableName: 'sales',
  }
);

// Expense model definition
export interface ExpenseAttributes {
  id: number;
  category: string;
  amount: number;
  date: string;
  loggedById: number;
}
export interface ExpenseCreationAttributes extends Optional<ExpenseAttributes, 'id'> {}

export class Expense extends Model<ExpenseAttributes, ExpenseCreationAttributes> implements ExpenseAttributes {
  public id!: number;
  public category!: string;
  public amount!: number;
  public date!: string;
  public loggedById!: number;
}

Expense.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    loggedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Expense',
    tableName: 'expenses',
  }
);

// CompanyLoan model definition
export interface CompanyLoanAttributes {
  id: number;
  lender: string;
  amount: number;
  repaidAmount: number;
  date: string;
}
export interface CompanyLoanCreationAttributes extends Optional<CompanyLoanAttributes, 'id'> {}

export class CompanyLoan extends Model<CompanyLoanAttributes, CompanyLoanCreationAttributes> implements CompanyLoanAttributes {
  public id!: number;
  public lender!: string;
  public amount!: number;
  public repaidAmount!: number;
  public date!: string;
}

CompanyLoan.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    lender: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    repaidAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'CompanyLoan',
    tableName: 'company_loans',
  }
);

// Define Relationships
// Sale <-> User (Seller)
Sale.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
User.hasMany(Sale, { foreignKey: 'sellerId', as: 'sales' });

// Sale <-> Material
Sale.belongsTo(Material, { foreignKey: 'materialId', as: 'material' });
Material.hasMany(Sale, { foreignKey: 'materialId', as: 'sales' });

// Expense <-> User (Logged By)
Expense.belongsTo(User, { foreignKey: 'loggedById', as: 'loggedBy' });
User.hasMany(Expense, { foreignKey: 'loggedById', as: 'expenses' });

// Database Initialization and Seeding helper
export async function initDatabase() {
  try {
    // Try to optimize SQLite performance, but catch any environment limitations gracefully
    try {
      await sequelize.query('PRAGMA journal_mode=WAL;');
      await sequelize.query('PRAGMA synchronous=NORMAL;');
    } catch (pragmaErr) {
      console.warn('⚠️ SQLite performance PRAGMAs ignored or not supported in this environment:', pragmaErr);
    }
    
    await sequelize.sync(); // Sync database schema safely, creates tables if they do not exist
    
    // Dynamically check and add repaidAmount column in case the SQLite table was already created
    try {
      await sequelize.query("ALTER TABLE sales ADD COLUMN repaidAmount REAL DEFAULT 0;");
      console.log("Successfully added column 'repaidAmount' to 'sales' table.");
    } catch (_) {
      // Ignored if column already exists
    }
  } catch (err: any) {
    const errMsg = String(err?.message || err);
    console.error('Database Sync Error:', err);
    
    const isCorrupt = errMsg.includes('SQLITE_CORRUPT') || 
                      errMsg.includes('malformed') || 
                      errMsg.includes('corrupt') || 
                      errMsg.includes('disk image is malformed');
                      
    if (isCorrupt) {
      console.warn('⚠️ SQLite database file is corrupt! Attempting automatic recovery...');
      try {
        const dbPath = process.env.VERCEL ? '/tmp/database.sqlite' : path.join(process.cwd(), 'database.sqlite');
        if (fs.existsSync(dbPath)) {
          const backupPath = process.env.VERCEL 
            ? `/tmp/database.sqlite.corrupt-${Date.now()}` 
            : path.join(process.cwd(), `database.sqlite.corrupt-${Date.now()}`);
          fs.renameSync(dbPath, backupPath);
          console.log(`Successfully backed up corrupt database to: ${backupPath}`);
        }
        
        // Re-sync with a fresh database
        await sequelize.sync({ force: true });
        console.log('✅ Re-created a clean SQLite database successfully.');
      } catch (recoveryErr) {
        console.error('Critical Error: Failed to automatically recover corrupt database:', recoveryErr);
        throw err;
      }
    } else {
      throw err;
    }
  }
  
  // Seed Users if empty
  const userCount = await User.count();
  if (userCount === 0) {
    const saltRounds = 10;
    
    // Create Admin
    await User.create({
      name: 'Natey Admin',
      email: 'admin@company.com',
      passwordHash: bcrypt.hashSync('admin123', saltRounds),
      role: 'Admin',
      status: 'active',
    });

    // Create Finance Guy
    await User.create({
      name: 'Felix Finance',
      email: 'finance@company.com',
      passwordHash: bcrypt.hashSync('finance123', saltRounds),
      role: 'Finance',
      status: 'active',
    });

    // Create Sellers
    await User.create({
      name: 'Sam Seller',
      email: 'seller@company.com',
      passwordHash: bcrypt.hashSync('seller123', saltRounds),
      role: 'Seller',
      status: 'active',
    });

    await User.create({
      name: 'Silvia Sales',
      email: 'silvia@company.com',
      passwordHash: bcrypt.hashSync('seller123', saltRounds),
      role: 'Seller',
      status: 'active',
    });

    // Seed some initial materials (inventory)
    const rawCopper = await Material.create({
      name: 'Copper Wire Coils',
      sku: 'COP-WRE-001',
      quantity: 500,
      costPrice: 4.5,
      supplier: 'Santiago Copper S.A.',
      importDate: '2026-05-15',
    });

    const steelSheets = await Material.create({
      name: 'Industrial Steel Sheets',
      sku: 'STL-SHT-502',
      quantity: 250,
      costPrice: 12.0,
      supplier: 'Steel Corp India',
      importDate: '2026-05-20',
    });

    const solarPanels = await Material.create({
      name: 'Monocrystalline Solar Modules',
      sku: 'SLR-PAN-109',
      quantity: 120,
      costPrice: 75.0,
      supplier: 'Guangdong Solar Tech',
      importDate: '2026-06-01',
    });

    // Seed some Sales
    await Sale.create({
      sellerId: 3, // Sam Seller
      customerName: 'Global Grid Corp',
      materialId: rawCopper.id,
      quantity: 30,
      totalAmount: 240.0, // Selling at 8.0 per unit (profit generated: 8.0 - 4.5 = 3.5 per unit)
      paymentMethod: 'Transfer',
      date: '2026-06-02',
    });

    await Sale.create({
      sellerId: 4, // Silvia Sales
      customerName: 'Smarter Energy Ltd',
      materialId: solarPanels.id,
      quantity: 10,
      totalAmount: 1100.0, // Selling at 110.0 per unit (cost was 75.0)
      paymentMethod: 'Transfer',
      date: '2026-06-03',
    });

    // Seed some Expenses
    await Expense.create({
      category: 'Warehouse Electricity',
      amount: 450.0,
      date: '2026-06-01',
      loggedById: 2, // Felix Finance
    });

    await Expense.create({
      category: 'Customs Declaration Fee',
      amount: 600.0,
      date: '2026-06-02',
      loggedById: 2, // Felix Finance
    });

    // Seed some initial Company Loans
    await CompanyLoan.create({
      lender: 'Development Bank of Ethiopia',
      amount: 50000.0,
      repaidAmount: 15000.0,
      date: '2026-05-10',
    });

    await CompanyLoan.create({
      lender: 'National Investment Fund',
      amount: 25000.0,
      repaidAmount: 0.0,
      date: '2026-06-05',
    });
  }
}
