import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Matches AutoWheels/constants/cities.ts display names */
const CITY_NAMES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Sialkot',
  'Gujranwala',
  'Sargodha',
  'Bahawalpur',
  'Sukkar',
  'Hyderabad',
  'Jhang',
  'Mardan',
  'Abbottabad',
  'Jhelum',
  'Chakwal',
  'Gilgit',
];

async function main() {
  for (const name of CITY_NAMES) {
    await prisma.city.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const honda = await prisma.brand.upsert({
    where: { name: 'Honda' },
    update: {},
    create: { name: 'Honda' },
  });

  const toyota = await prisma.brand.upsert({
    where: { name: 'Toyota' },
    update: {},
    create: { name: 'Toyota' },
  });

  const models: { brandId: string; name: string }[] = [
    { brandId: honda.id, name: 'Civic' },
    { brandId: honda.id, name: 'City' },
    { brandId: toyota.id, name: 'Corolla GLI' },
    { brandId: toyota.id, name: 'Hilux Revo' },
  ];

  for (const m of models) {
    await prisma.carModel.upsert({
      where: {
        name_brandId: { name: m.name, brandId: m.brandId },
      },
      update: {},
      create: m,
    });
  }
}

main()
  .then(() => {
    console.log('Seed finished: cities, Honda/Toyota, and default models.');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
