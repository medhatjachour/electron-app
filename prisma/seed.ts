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

  // ==================== 150 PRODUCTS ====================
  console.log('📦 Creating 150 products...');
  
  const categories = ['Electronics', 'Clothing', 'Home', 'Sports', 'Books', 'Toys', 'Food', 'Beauty', 'Auto', 'Office'];
  const colors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Pink', 'Gray', 'Brown'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  const placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  const names = ['Headphones', 'Watch', 'Speaker', 'Cable', 'Case', 'Stand', 'Mouse', 'Keyboard', 'Webcam', 'Powerbank',
    'T-Shirt', 'Jeans', 'Hoodie', 'Polo', 'Shirt', 'Pants', 'Shorts', 'Tank', 'Sweater', 'Jacket',
    'Mug', 'Bottle', 'Plate', 'Board', 'Knife', 'Bowl', 'Container', 'Can', 'Basket', 'Pillow',
    'Mat', 'Dumbbell', 'Bands', 'Rope', 'Bag', 'Shoes', 'Socks', 'Band', 'Wraps', 'Roller',
    'Novel', 'Mystery', 'SciFi', 'Bio', 'Self-Help', 'Cook', 'Travel', 'History', 'Poetry', 'Art',
    'Blocks', 'Figure', 'Puzzle', 'Board Game', 'Cards', 'Plush', 'Car', 'Doll', 'Kit', 'Ball',
    'Coffee', 'Tea', 'Protein', 'Energy', 'Snack', 'Chocolate', 'Cookies', 'Chips', 'Fruit', 'Nuts',
    'Cream', 'Shampoo', 'Conditioner', 'Lotion', 'Hand Cream', 'Balm', 'Perfume', 'Polish', 'Mask', 'Brush',
    'Mount', 'Cam', 'Gauge', 'Freshener', 'Cleaning', 'Mat', 'Cover', 'Wheel Cover', 'Organizer', 'Charger',
    'Notebook', 'Pen', 'Pencil', 'Stapler', 'Clips', 'Notes', 'Folder', 'Binder', 'Calculator', 'Pad',
    'Tape', 'Scissors', 'Ruler', 'Highlighter', 'Marker', 'Eraser', 'Glue', 'Stamps', 'Labels', 'Paper',
    'Desk Lamp', 'Chair Pad', 'Monitor', 'USB Hub', 'Document Holder', 'Desk Fan', 'Shelf', 'Drawer', 'Box', 'Tray',
    'Wifi Router', 'Ethernet', 'Switch', 'Adapter', 'Extension', 'Surge Protector', 'Battery', 'Light Bulb', 'Flashlight', 'Lantern',
    'Backpack', 'Wallet', 'Belt', 'Tie', 'Scarf', 'Hat', 'Gloves', 'Umbrella', 'Sunglasses', 'Watch Band',
    'Phone Holder', 'Tablet Case', 'Screen Cleaner', 'Stylus', 'Ear Buds', 'Charger Pad', 'Ring Light', 'Tripod', 'Mic', 'Adapter'
  ];
  
  for (let i = 0; i < 150; i++) {
    const cat = categories[i % 10];
    const name = names[i] + ' ' + (Math.floor(i/10) + 1);
    const price = Math.floor(Math.random() * 200) + 10;
    const hasVar = i % 3 === 0;
    
    await prisma.product.create({
      data: {
        name,
        baseSKU: `SKU${(i+1).toString().padStart(4, '0')}`,
        category: cat,
        description: `Premium ${name.toLowerCase()}`,
        basePrice: price,
        baseCost: price * 0.6,
        hasVariants: hasVar,
        images: { create: [{ imageData: placeholder, order: 0 }] },
        variants: {
          create: hasVar ? 
            [{
              color: colors[i % 10],
              size: sizes[i % 5],
              sku: `${name.substring(0,3).toUpperCase()}-${i+1}`,
              price,
              stock: Math.floor(Math.random() * 100) + 10
            }] :
            [{
              color: 'Standard',
              size: 'One Size',
              sku: `${name.substring(0,3).toUpperCase()}-${i+1}`,
              price,
              stock: Math.floor(Math.random() * 100) + 10
            }]
        }
      }
    });
    
    if ((i + 1) % 30 === 0) console.log(`  Created ${i + 1} products...`);
  }
  
  console.log('✅ Created 150 products\n');

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