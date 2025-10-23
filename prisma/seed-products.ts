import { PrismaClient } from '../src/generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed for 150 products...\n');

  // Create dev user if doesn't exist
  const existingUser = await prisma.user.findUnique({ where: { username: '0000' } });
  if (!existingUser) {
    const devPassword = await bcrypt.hash('0000', 10);
    await prisma.user.create({
      data: { username: '0000', passwordHash: devPassword, role: 'admin' },
    });
    console.log('✅ Created dev user (0000/0000)\n');
  }

  // Create stores if they don't exist
  const stores = [];
  for (let i = 0; i < 4; i++) {
    const storeName = ['Downtown Store', 'Mall Branch', 'Airport Outlet', 'Suburban Center'][i];
    let store = await prisma.store.findFirst({ where: { name: storeName } });
    if (!store) {
      store = await prisma.store.create({
        data: {
          name: storeName,
          location: `Location ${i + 1}`,
          phone: `+1-555-010${i + 1}`,
          hours: '9:00 AM - 9:00 PM',
          manager: `Manager ${i + 1}`,
          status: 'active',
        },
      });
    }
    stores.push(store);
  }
  console.log('✅ Stores ready\n');

  // ==================== 150 PRODUCTS ====================
  console.log('📦 Creating 150 products...');

  const categories = ['Electronics', 'Clothing', 'Home', 'Sports', 'Books', 'Toys', 'Food', 'Beauty', 'Auto', 'Office'];
  const colors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Pink', 'Gray', 'Brown'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  const placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const productNames = [
    'Wireless Headphones', 'Smart Watch', 'Bluetooth Speaker', 'USB-C Cable', 'Phone Case',
    'Laptop Stand', 'Wireless Mouse', 'Keyboard', 'Webcam', 'Power Bank',
    'HDMI Cable', 'Screen Protector', 'Tablet Stand', 'Charging Dock', 'Cable Organizer',

    'Cotton T-Shirt', 'Denim Jeans', 'Hoodie', 'Polo Shirt', 'Dress Shirt',
    'Cargo Pants', 'Shorts', 'Tank Top', 'Sweater', 'Cardigan',
    'Jacket', 'Blazer', 'Dress', 'Skirt', 'Leggings',

    'Coffee Mug', 'Water Bottle', 'Dinner Plate', 'Cutting Board', 'Kitchen Knife',
    'Mixing Bowl', 'Storage Container', 'Trash Can', 'Laundry Basket', 'Pillow',
    'Blanket', 'Towel Set', 'Bath Mat', 'Shower Curtain', 'Candle',

    'Yoga Mat', 'Dumbbell Set', 'Resistance Bands', 'Jump Rope', 'Gym Water Bottle',
    'Gym Bag', 'Running Shoes', 'Sports Socks', 'Headband', 'Wrist Wraps',
    'Foam Roller', 'Exercise Ball', 'Kettlebell', 'Pull-up Bar', 'Ankle Weights',

    'Fiction Novel', 'Mystery Book', 'Science Fiction', 'Biography', 'Self-Help Book',
    'Cookbook', 'Travel Guide', 'History Book', 'Poetry Collection', 'Art Book',
    'Business Book', 'Psychology Book', 'Philosophy Book', 'Comic Book', 'Graphic Novel',

    'Building Blocks', 'Action Figure', 'Puzzle Set', 'Board Game', 'Card Game',
    'Plush Toy', 'Remote Car', 'Doll', 'Art Set', 'Science Kit',
    'Robot Toy', 'Ball Set', 'Musical Toy', 'Educational Game', 'Flying Disc',

    'Coffee Beans', 'Tea Box', 'Protein Bar', 'Energy Drink', 'Snack Mix',
    'Chocolate Box', 'Cookies Pack', 'Chips', 'Dried Fruit', 'Nuts Mix',
    'Granola Bar', 'Instant Noodles', 'Pasta', 'Sauce', 'Spices Set',

    'Face Cream', 'Shampoo', 'Conditioner', 'Body Lotion', 'Hand Cream',
    'Lip Balm', 'Perfume', 'Nail Polish', 'Face Mask', 'Makeup Brush Set',
    'Hair Brush', 'Hair Dryer', 'Straightener', 'Face Wash', 'Sunscreen',

    'Car Phone Mount', 'Dash Cam', 'Tire Gauge', 'Air Freshener', 'Cleaning Kit',
    'Floor Mat', 'Seat Cover', 'Steering Wheel Cover', 'Trunk Organizer', 'USB Car Charger',

    'Notebook', 'Pen Set', 'Pencil Case', 'Stapler', 'Paper Clips',
    'Sticky Notes', 'File Folder', 'Binder', 'Calculator', 'Desk Pad',
    'Tape Dispenser', 'Scissors', 'Ruler', 'Highlighter Set', 'Whiteboard Marker',
    'Desk Lamp', 'Monitor Stand', 'USB Hub', 'Document Tray', 'Shelf Organizer',
    'Wireless Keyboard', 'Ergonomic Chair Pad', 'Cable Management', 'Desk Plant', 'Photo Frame',
    'Wall Calendar', 'Desk Clock', 'Pen Holder', 'Letter Opener', 'Stamp Pad'
  ];

  let created = 0;
  for (let i = 0; i < 150; i++) {
    const category = categories[Math.floor(i / 15)];
    const productName = productNames[i];
    const basePrice = Math.floor(Math.random() * 200) + 10;
    const baseCost = basePrice * 0.6;
    const hasVariants = ['Clothing', 'Electronics', 'Sports'].includes(category);

    // Check if product already exists
    const existing = await prisma.product.findUnique({
      where: { baseSKU: `SKU-${String(i + 1).padStart(4, '0')}` }
    });

    if (!existing) {
      await prisma.product.create({
        data: {
          name: productName,
          baseSKU: `SKU-${String(i + 1).padStart(4, '0')}`,
          category,
          description: `High quality ${productName.toLowerCase()} for everyday use.`,
          basePrice,
          baseCost,
          hasVariants,
          storeId: stores[i % 4].id,
          images: {
            create: [{ imageData: placeholder, order: 0 }]
          },
          variants: {
            create: hasVariants
              ? Array.from({ length: Math.floor(Math.random() * 3) + 2 }, (_, idx) => {
                  const color = colors[Math.floor(Math.random() * colors.length)];
                  const size = category === 'Clothing' ? sizes[Math.floor(Math.random() * sizes.length)] : undefined;
                  const variantPrice = basePrice + (Math.random() * 20 - 10);

                  return {
                    color,
                    size,
                    sku: `V-${Date.now()}-${i}-${idx}-${Math.random().toString(36).substring(7)}`,
                    price: Math.max(variantPrice, 5),
                    stock: Math.floor(Math.random() * 100) + 10
                  };
                })
              : [
                  {
                    color: 'Standard',
                    size: 'One Size',
                    sku: `V-${Date.now()}-${i}-STD-${Math.random().toString(36).substring(7)}`,
                    price: basePrice,
                    stock: Math.floor(Math.random() * 100) + 10
                  }
                ]
          }
        }
      });
      created++;

      if (created % 30 === 0) {
        console.log(`  Created ${created} products...`);
      }
    }
  }

  console.log(`✅ Created ${created} new products (${150 - created} already existed)\n`);
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
