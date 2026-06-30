import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding REOS database...');

  // 1. Clean existing data
  await prisma.supplierProduct.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.installer.deleteMany();

  // 2. Create Products
  const panel1 = await prisma.product.create({
    data: {
      name: 'Jinko Tiger Neo N-type 450W',
      category: 'PANEL',
      model: 'JKM450N-54HL4',
      rating: 450,
    },
  });

  const panel2 = await prisma.product.create({
    data: {
      name: 'Longi Hi-MO 6 Explorer 540W',
      category: 'PANEL',
      model: 'LR5-72HTH-540M',
      rating: 540,
    },
  });

  const battery1 = await prisma.product.create({
    data: {
      name: 'Pylontech US5000 4.8kWh LFP',
      category: 'BATTERY',
      model: 'US5000',
      rating: 100, // 100Ah
    },
  });

  const battery2 = await prisma.product.create({
    data: {
      name: 'BYD Battery-Box Premium LV Flex 5.0kWh',
      category: 'BATTERY',
      model: 'LV-Flex-5.0',
      rating: 100,
    },
  });

  const inverter1 = await prisma.product.create({
    data: {
      name: 'Deye 8kW Hybrid Inverter 48V',
      category: 'INVERTER',
      model: 'SUN-8K-SG01LP1',
      rating: 8000,
    },
  });

  const inverter2 = await prisma.product.create({
    data: {
      name: 'Victron MultiPlus-II 48/3000/35',
      category: 'INVERTER',
      model: 'PMP483021010',
      rating: 3000,
    },
  });

  // 3. Create Suppliers
  const supplierA = await prisma.supplier.create({
    data: {
      name: 'CleanEnergy Africa Ltd',
      contact: 'sales@cleanenergyafrica.com',
      rating: 4.8,
    },
  });

  const supplierB = await prisma.supplier.create({
    data: {
      name: 'Lagos Solar Depot',
      contact: 'orders@solardepot.ng',
      rating: 4.5,
    },
  });

  // 4. Link Products to Suppliers (SupplierProduct)
  await prisma.supplierProduct.createMany({
    data: [
      { productId: panel1.id, supplierId: supplierA.id, price: 180, stock: 150, leadTime: 2 },
      { productId: panel1.id, supplierId: supplierB.id, price: 170, stock: 80, leadTime: 3 },
      { productId: panel2.id, supplierId: supplierA.id, price: 210, stock: 200, leadTime: 2 },
      { productId: panel2.id, supplierId: supplierB.id, price: 220, stock: 120, leadTime: 1 },
      { productId: battery1.id, supplierId: supplierA.id, price: 1450, stock: 45, leadTime: 4 },
      { productId: battery1.id, supplierId: supplierB.id, price: 1420, stock: 20, leadTime: 5 },
      { productId: battery2.id, supplierId: supplierA.id, price: 1600, stock: 15, leadTime: 3 },
      { productId: inverter1.id, supplierId: supplierA.id, price: 1950, stock: 10, leadTime: 7 },
      { productId: inverter1.id, supplierId: supplierB.id, price: 1900, stock: 8, leadTime: 6 },
      { productId: inverter2.id, supplierId: supplierA.id, price: 1250, stock: 25, leadTime: 3 },
    ],
  });

  // 5. Create Installers
  await prisma.installer.create({
    data: {
      name: 'Eko Power Solutions',
      contact: 'info@ekopower.ng',
      rating: 4.9,
      baseRate: 750,
      location: 'Lagos Island, Nigeria',
    },
  });

  await prisma.installer.create({
    data: {
      name: 'Naija Solar Technicians',
      contact: 'install@naijasolar.com',
      rating: 4.6,
      baseRate: 600,
      location: 'Ikeja, Lagos, Nigeria',
    },
  });

  console.log('REOS Database successfully seeded!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
