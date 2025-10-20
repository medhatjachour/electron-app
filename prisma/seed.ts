import { PrismaClient } from '../src/generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const salesPassword = await bcrypt.hash('sales123', 10);
  const inventoryPassword = await bcrypt.hash('inventory123', 10);
  const financePassword = await bcrypt.hash('finance123', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: adminPassword,
      role: 'admin',
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      username: 'sales',
      passwordHash: salesPassword,
      role: 'sales',
    },
  });

  const inventoryUser = await prisma.user.create({
    data: {
      username: 'inventory',
      passwordHash: inventoryPassword,
      role: 'inventory',
    },
  });

  const financeUser = await prisma.user.create({
    data: {
      username: 'finance',
      passwordHash: financePassword,
      role: 'finance',
    },
  });

  // Create sample products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Laptop',
        sku: 'LAP001',
        price: 999.99,
        stock: 15,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Mouse',
        sku: 'MOU001',
        price: 29.99,
        stock: 50,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Keyboard',
        sku: 'KEY001',
        price: 59.99,
        stock: 30,
      },
    }),
  ]);

  // Create sample sales
  await Promise.all([
    prisma.sale.create({
      data: {
        productId: products[0].id,
        userId: salesUser.id,
        quantity: 1,
        total: products[0].price,
      },
    }),
    prisma.sale.create({
      data: {
        productId: products[1].id,
        userId: salesUser.id,
        quantity: 2,
        total: products[1].price * 2,
      },
    }),
  ]);

  // Create sample transactions
  await Promise.all([
    prisma.transaction.create({
      data: {
        type: 'income',
        amount: 999.99,
        description: 'Laptop sale',
        userId: financeUser.id,
      },
    }),
    prisma.transaction.create({
      data: {
        type: 'expense',
        amount: 500.0,
        description: 'Office supplies',
        userId: financeUser.id,
      },
    }),
  ]);

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });