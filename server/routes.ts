import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, Material, Sale, Expense, sequelize } from './db.js';
import { authenticateJWT, requireRole, generateToken, COOKIE_OPTIONS, AuthenticatedRequest } from './auth.js';

export const routes = Router();

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// Login Route
routes.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Please provide email and password.' });
    return;
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user || user.status === 'inactive') {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Logout Route
routes.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Get Current User Status
routes.get('/api/auth/me', authenticateJWT, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});


// ==========================================
// 2. ADMIN USER-MANAGEMENT ROUTES (Exclusively Admin)
// ==========================================

// GET all users (Sellers & Finance Guys)
routes.get('/api/admin/users', authenticateJWT, requireRole(['Admin', 'Finance']), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST to create a new user (Seller or Finance Guy)
routes.post('/api/admin/users', authenticateJWT, requireRole(['Admin']), async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400).json({ error: 'Please fill in all user fields (name, email/username, password, role).' });
    return;
  }

  if (!['Finance', 'Seller'].includes(role)) {
    res.status(400).json({ error: 'Users can only be created with role: Finance or Seller. Admins are system-assigned.' });
    return;
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'User with this email/username already exists.' });
      return;
    }

    const saltRounds = 10;
    const passwordHash = bcrypt.hashSync(password, saltRounds);

    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role,
      status: 'active',
    });

    res.status(201).json({
      message: `${role} account created successfully!`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT to edit or toggle deactivation of users
routes.put('/api/admin/users/:id', authenticateJWT, requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, status } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (user.email === 'admin@company.com' && status === 'inactive') {
      res.status(400).json({ error: 'Cannot deactivate master admin account.' });
      return;
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role && ['Finance', 'Seller', 'Admin'].includes(role)) user.role = role;
    if (status && ['active', 'inactive'].includes(status)) user.status = status;

    if (password && password.trim() !== '') {
      user.passwordHash = bcrypt.hashSync(password, 10);
    }

    await user.save();
    res.json({ message: 'User updated successfully.', user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE/Deactivate user
routes.delete('/api/admin/users/:id', authenticateJWT, requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (user.email === 'admin@company.com') {
      res.status(400).json({ error: 'Cannot delete master admin.' });
      return;
    }

    // Rather than just deactivating, to keep referential integrity we delete dependencies first
    await Expense.destroy({ where: { loggedById: id } });
    await Sale.destroy({ where: { sellerId: id } });
    await user.destroy();
    res.json({ message: 'User and all associated transaction logs deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// 3. MATERIAL INVENTORY ROUTES (Admin & Finance)
// ==========================================

routes.get('/api/inventory', authenticateJWT, requireRole(['Admin', 'Finance', 'Seller']), async (req, res) => {
  try {
    const materials = await Material.findAll({
      order: [['name', 'ASC']],
    });
    res.json(materials);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

routes.post('/api/inventory', authenticateJWT, requireRole(['Admin', 'Finance']), async (req, res) => {
  const { name, sku, quantity, costPrice, supplier, importDate } = req.body;

  if (!name || !sku || quantity === undefined || costPrice === undefined || !supplier || !importDate) {
    res.status(400).json({ error: 'All material fields are required.' });
    return;
  }

  try {
    const existingMaterial = await Material.findOne({ where: { sku } });
    if (existingMaterial) {
      res.status(400).json({ error: 'Material with this SKU already exists.' });
      return;
    }

    const newMaterial = await Material.create({
      name,
      sku,
      quantity: Number(quantity),
      costPrice: Number(costPrice),
      supplier,
      importDate,
    });

    res.status(201).json({ message: 'Material imported successfully!', material: newMaterial });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

routes.put('/api/inventory/:id', authenticateJWT, requireRole(['Admin', 'Finance']), async (req, res) => {
  const { id } = req.params;
  const { name, sku, quantity, costPrice, supplier, importDate, restockDate } = req.body;

  try {
    const material = await Material.findByPk(id);
    if (!material) {
      res.status(404).json({ error: 'Material not found.' });
      return;
    }

    if (name) material.name = name;
    if (sku) material.sku = sku;
    if (quantity !== undefined) material.quantity = Number(quantity);
    if (costPrice !== undefined) material.costPrice = Number(costPrice);
    if (supplier) material.supplier = supplier;
    if (importDate) material.importDate = importDate;
    if (restockDate !== undefined) material.restockDate = restockDate;

    await material.save();
    res.json({ message: 'Material stock updated.', material });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

routes.delete('/api/inventory/:id', authenticateJWT, requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;

  try {
    const material = await Material.findByPk(id);
    if (!material) {
      res.status(404).json({ error: 'Material not found.' });
      return;
    }

    // Safely update all related Sales so they keep historical metadata but release foreign key reference
    await Sale.update(
      { materialId: null },
      { where: { materialId: id } }
    );

    await material.destroy();
    res.json({ message: 'Material deleted successfully from registry.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// 4. SALES ROUTES (Sellers & Admins)
// ==========================================

routes.get('/api/sales', authenticateJWT, requireRole(['Admin', 'Seller', 'Finance']), async (req: AuthenticatedRequest, res) => {
  try {
    const userRole = req.user!.role;
    const userId = req.user!.id;

    let sales;
    if (userRole === 'Admin' || userRole === 'Finance') {
      sales = await Sale.findAll({
        include: [
          { model: User, as: 'seller', attributes: ['id', 'name', 'email'] },
          { model: Material, as: 'material', attributes: ['id', 'name', 'sku'] },
        ],
        order: [['date', 'DESC'], ['id', 'DESC']],
      });
    } else {
      // Seller can ONLY view their own logged sales
      sales = await Sale.findAll({
        where: { sellerId: userId },
        include: [
          { model: User, as: 'seller', attributes: ['id', 'name', 'email'] },
          { model: Material, as: 'material', attributes: ['id', 'name', 'sku'] },
        ],
        order: [['date', 'DESC'], ['id', 'DESC']],
      });
    }

    res.json(sales);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create Sale transaction (Decrement stock atomically with SQL Transaction mapping)
routes.post('/api/sales', authenticateJWT, requireRole(['Seller', 'Finance', 'Admin']), async (req: AuthenticatedRequest, res) => {
  const { customerName, materialId, quantity, totalAmount, paymentMethod, date, transferBank } = req.body;
  
  let sellerId = req.user!.id;
  if ((req.user!.role === 'Admin' || req.user!.role === 'Finance') && req.body.sellerId) {
    sellerId = Number(req.body.sellerId);
  }

  if (!customerName || !materialId || !quantity || !totalAmount || !paymentMethod || !date) {
    res.status(400).json({ error: 'All sale transaction fields are required.' });
    return;
  }

  const requestedQty = Number(quantity);
  if (requestedQty <= 0) {
    res.status(400).json({ error: 'Sale quantity must be greater than zero.' });
    return;
  }

  // Start Transaction block to guarantee atomicity (Stock management + Sale creation)
  const t = await sequelize.transaction();

  try {
    // 1. Fetch Material details and check stock inside transaction
    const material = await Material.findByPk(materialId, { transaction: t });
    if (!material) {
      await t.rollback();
      res.status(404).json({ error: 'Selected material was not found in the inventory registry.' });
      return;
    }

    if (material.quantity < requestedQty) {
      await t.rollback();
      res.status(400).json({
        error: `Insufficient stock! Remaining balance for ${material.name} is only ${material.quantity} units, but sale requested ${requestedQty} units.`,
      });
      return;
    }

    // 2. Decrement stock
    material.quantity -= requestedQty;
    
    const isSoldOutAndDeleted = material.quantity === 0;
    const savedMaterialName = material.name;
    const savedMaterialSku = material.sku;

    if (isSoldOutAndDeleted) {
      // Safely delete since it is sold out
      await material.destroy({ transaction: t });
    } else {
      await material.save({ transaction: t });
    }

    // 3. Create Sale Record
    const newSale = await Sale.create(
      {
        sellerId,
        customerName,
        materialId: isSoldOutAndDeleted ? null : Number(materialId),
        materialName: savedMaterialName,
        materialSku: savedMaterialSku,
        quantity: requestedQty,
        totalAmount: Number(totalAmount),
        paymentMethod,
        transferBank: paymentMethod === 'Transfer' ? transferBank : null,
        date,
      },
      { transaction: t }
    );

    // Commit changes safely
    await t.commit();

    res.status(201).json({
      message: isSoldOutAndDeleted
        ? `Sale logged successfully. Material "${savedMaterialName}" is now SOLD OUT and has been automatically deleted from the Registry!`
        : 'Sale logged successfully and inventory updated!',
      sale: newSale,
      isSoldOutAndDeleted,
      soldOutMaterialName: savedMaterialName
    });
  } catch (error: any) {
    await t.rollback();
    res.status(500).json({ error: 'Transaction failed: ' + error.message });
  }
});


routes.put('/api/sales/:id', authenticateJWT, requireRole(['Admin', 'Finance', 'Seller']), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { customerName, quantity, totalAmount, paymentMethod, transferBank, date } = req.body;

  try {
    const sale = await Sale.findByPk(id);
    if (!sale) {
      res.status(404).json({ error: 'Sale record not found.' });
      return;
    }

    // Role check: Seller can only edit their own sales
    if (req.user!.role === 'Seller' && sale.sellerId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden: Sellers can only edit their own sales.' });
      return;
    }

    // Adjust inventory if quantity changes
    if (quantity !== undefined && Number(quantity) !== sale.quantity && sale.materialId) {
      const material = await Material.findByPk(sale.materialId);
      if (material) {
        const qtyDiff = Number(quantity) - sale.quantity; // positive if selling more, negative if selling less
        if (material.quantity < qtyDiff) {
          res.status(400).json({ error: `Insufficient stock in inventory to adjust sale transaction! Remaining stock is ${material.quantity}.` });
          return;
        }
        material.quantity -= qtyDiff;
        if (material.quantity === 0) {
          await material.destroy();
        } else {
          await material.save();
        }
      }
      sale.quantity = Number(quantity);
    }

    if (customerName) sale.customerName = customerName;
    if (totalAmount !== undefined) sale.totalAmount = Number(totalAmount);
    if (paymentMethod) {
      sale.paymentMethod = paymentMethod;
      sale.transferBank = paymentMethod === 'Transfer' ? transferBank : null;
    }
    if (date) sale.date = date;

    await sale.save();
    res.json({ message: 'Sale record updated successfully.', sale });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


routes.delete('/api/sales/:id', authenticateJWT, requireRole(['Admin', 'Finance', 'Seller']), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  try {
    const sale = await Sale.findByPk(id);
    if (!sale) {
      res.status(404).json({ error: 'Sale record not found.' });
      return;
    }

    // Role check: Seller can only delete their own sales
    if (req.user!.role === 'Seller' && sale.sellerId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden: Sellers can only delete their own sales.' });
      return;
    }

    // Try to restore material quantity if material still exists
    if (sale.materialId) {
      const material = await Material.findByPk(sale.materialId);
      if (material) {
        material.quantity += sale.quantity;
        await material.save();
      }
    }

    await sale.destroy();
    res.json({ message: 'Sale record deleted and stock restored where applicable.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// 5. EXPENSE ROUTES (Admin & Finance)
// ==========================================

routes.get('/api/expenses', authenticateJWT, requireRole(['Admin', 'Finance']), async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      include: [
        { model: User, as: 'loggedBy', attributes: ['id', 'name', 'email'] },
      ],
      order: [['date', 'DESC']],
    });
    res.json(expenses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

routes.post('/api/expenses', authenticateJWT, requireRole(['Admin', 'Finance']), async (req: AuthenticatedRequest, res) => {
  const { category, amount, date } = req.body;
  const loggedById = req.user!.id;

  if (!category || amount === undefined || !date) {
    res.status(400).json({ error: 'All expense logging fields are required.' });
    return;
  }

  try {
    const newExpense = await Expense.create({
      category,
      amount: Number(amount),
      date,
      loggedById,
    });

    res.status(201).json({ message: 'Expense record saved successfully', expense: newExpense });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT to edit an expense
routes.put('/api/expenses/:id', authenticateJWT, requireRole(['Admin', 'Finance']), async (req, res) => {
  const { id } = req.params;
  const { category, amount, date } = req.body;

  try {
    const expense = await Expense.findByPk(id);
    if (!expense) {
      res.status(404).json({ error: 'Expense not found.' });
      return;
    }

    if (category) expense.category = category;
    if (amount !== undefined) expense.amount = Number(amount);
    if (date) expense.date = date;

    await expense.save();
    res.json({ message: 'Expense record updated successfully.', expense });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE an expense
routes.delete('/api/expenses/:id', authenticateJWT, requireRole(['Admin', 'Finance']), async (req, res) => {
  const { id } = req.params;

  try {
    const expense = await Expense.findByPk(id);
    if (!expense) {
      res.status(404).json({ error: 'Expense not found.' });
      return;
    }

    await expense.destroy();
    res.json({ message: 'Expense record deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// 6. FINANCIAL ANALYTICS & MASTER REPORTS (Admin & Finance Only)
// ==========================================

routes.get('/api/reports/master', authenticateJWT, requireRole(['Admin', 'Finance']), async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    // 1. Calculate Income (Sales sum)
    const sales = await Sale.findAll({
      include: [{ model: Material, as: 'material' }],
    });
    
    // Filter sales by date range if provided
    const filteredSales = sales.filter((sale) => {
      if (startDate && sale.date < (startDate as string)) return false;
      if (endDate && sale.date > (endDate as string)) return false;
      return true;
    });

    const totalIncome = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    // 2. Fetch all materials cost (Spent on importing)
    const materials = await Material.findAll();
    const inventoryAssetValue = materials.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);

    // To compute a clean Profit margin, we calculate the Cost of Goods Sold (COGS) on actual items sold:
    // COGS = quantity sold * costPrice of the linked imported material
    const cogs = filteredSales.reduce((sum, sale) => {
      const originalCostPrice = (sale as any).material?.costPrice || 0;
      return sum + (sale.quantity * originalCostPrice);
    }, 0);

    // 3. Company Expenses logged
    const expenses = await Expense.findAll();
    const filteredExpenses = expenses.filter((exp) => {
      if (startDate && exp.date < (startDate as string)) return false;
      if (endDate && exp.date > (endDate as string)) return false;
      return true;
    });
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Net Profit calculation
    const grossProfit = totalIncome - cogs;
    const netProfit = grossProfit - totalExpenses;

    res.json({
      revenue: totalIncome,
      cogs: cogs, // Cost of Goods Sold (Actual cost price of materials sold)
      grossProfit: grossProfit,
      companyExpenses: totalExpenses,
      netProfit: netProfit,
      inventoryAssetValue: inventoryAssetValue, // Total book value of remaining stock
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Seller Performance Report (Breakdown per seller)
routes.get('/api/reports/sellers', authenticateJWT, requireRole(['Admin', 'Finance']), async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    // Fetch all active or inactive Users to summarize sales
    const sellers = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'status'],
    });

    const performance = [];

    for (const seller of sellers) {
      const sales = await Sale.findAll({
        where: { sellerId: seller.id },
        include: [{ model: Material, as: 'material' }],
      });

      const filteredSales = sales.filter((sale) => {
        if (startDate && sale.date < (startDate as string)) return false;
        if (endDate && sale.date > (endDate as string)) return false;
        return true;
      });

      // Avoid cluttering the list with Admin and Finance users who have zero sales
      if (filteredSales.length === 0 && seller.role !== 'Seller') {
        continue;
      }

      const totalSalesValue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const itemsSold = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0);
      
      const salesCostBasis = filteredSales.reduce((sum, sale) => {
        const costBasis = (sale as any).material?.costPrice || 0;
        return sum + (sale.quantity * costBasis);
      }, 0);

      const sellerProfit = totalSalesValue - salesCostBasis;

      performance.push({
        sellerId: seller.id,
        name: seller.name,
        email: seller.email,
        status: seller.status,
        totalSalesAmount: totalSalesValue,
        totalTransactions: filteredSales.length,
        totalItemsSold: itemsSold,
        profitContribution: sellerProfit,
        sales: filteredSales.map(sf => ({
          id: sf.id,
          customerName: sf.customerName,
          materialName: sf.materialName || (sf as any).material?.name || 'Deleted Material Reference',
          materialSku: sf.materialSku || (sf as any).material?.sku || 'N/A',
          quantity: sf.quantity,
          totalAmount: sf.totalAmount,
          date: sf.date
        }))
      });
    }

    // Sort sellers by highest revenue contribution
    performance.sort((a, b) => b.totalSalesAmount - a.totalSalesAmount);
    res.json(performance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
