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

  /**
   * Showroom specs only (not marketplace listings).
   * Shown under “New cars” in the app — informational brochures, not for sale.
   */
  const showroomModels = [
    await prisma.carModel.findFirst({
      where: { name: 'Civic', brandId: honda.id },
    }),
    await prisma.carModel.findFirst({
      where: { name: 'City', brandId: honda.id },
    }),
    await prisma.carModel.findFirst({
      where: { name: 'Corolla GLI', brandId: toyota.id },
    }),
  ].filter((m): m is NonNullable<typeof m> => Boolean(m));

  if (
    showroomModels.length > 0 &&
    (await prisma.newCar.count()) === 0
  ) {
    const Civic = showroomModels.find((m) => m.name === 'Civic');
    const CityModel = showroomModels.find((m) => m.name === 'City');
    const Corolla = showroomModels.find((m) => m.name === 'Corolla GLI');

    if (Civic) {
      await prisma.newCar.create({
        data: {
          name: 'Honda Civic Turbo (reference)',
          description:
            `Reference specifications for shoppers comparing new Civic variants (not sold through this marketplace).\n\n` +
            `Safety: Collision mitigation braking, adaptive cruise*, lane guidance* (*trim dependent).\n` +
            `Engine: 4-cylinder turbo, front-wheel drive.\n` +
            `Transmission: CVT variant common in Pakistan market.\n` +
            `Use this guide to research before buying from an authorized dealer — used listings remain under “Used cars”.`,
          priceMin: 9200000,
          priceMax: 9800000,
          year: 2025,
          fuelType: 'PETROL',
          transmission: 'AUTOMATIC',
          mileage: '12-15 km/l',
          bodyType: 'Sedan',
          engine: '1498 cc Turbo',
          features: ['ABS', 'Airbags', 'Cruise Control', 'Infotainment'],
          featured: true,
          brandId: honda.id,
          modelId: Civic.id,
          images: {
            create: [
              {
                url: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900&q=80',
              },
            ],
          },
        },
      });
    }

    if (CityModel) {
      await prisma.newCar.create({
        data: {
          name: 'Honda City V (reference)',
          description:
            'City-class sedan overview for Pakistani buyers researching new-stock options.\n\n' +
            'Typical specs: Naturally aspirated petrol, CVT automatic available on higher trims.\n' +
            'Interior: Touchscreen infotainment on facelift models, revised HVAC controls.\n' +
            'This entry is informational only — purchase new vehicles through dealerships.',
          priceMin: 5200000,
          priceMax: 5800000,
          year: 2024,
          fuelType: 'PETROL',
          transmission: 'MANUAL',
          mileage: '14-17 km/l',
          bodyType: 'Sedan',
          engine: '1497 cc',
          features: ['ABS', 'Rear Camera', 'Touchscreen'],
          featured: false,
          brandId: honda.id,
          modelId: CityModel.id,
          images: {
            create: [
              {
                url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900&q=80',
              },
            ],
          },
        },
      });
    }

    if (Corolla) {
      await prisma.newCar.create({
        data: {
          name: 'Toyota Corolla facelift (reference)',
          description:
            'High-level brochure-style summary for the Corolla line-up as sold new in-market.\n\n' +
            'Powertrain choices often include petrol and hybrid trims depending on year and importer.\n' +
            'Safety: Stability control and multiple airbags on recent generations.\n' +
            'Not a listing — use “Used cars” to buy peer-to-peer on AutoWheels.',
          priceMin: 7800000,
          priceMax: 8600000,
          year: 2025,
          fuelType: 'HYBRID',
          transmission: 'AUTOMATIC',
          mileage: '18-22 km/l',
          bodyType: 'Sedan',
          engine: '1798 cc Hybrid',
          features: ['ABS', 'Multiple Airbags', 'Stability Control'],
          featured: true,
          brandId: toyota.id,
          modelId: Corolla.id,
          images: {
            create: [
              {
                url: 'https://images.unsplash.com/photo-1621007947382-bb3c39934e94?w=900&q=80',
              },
            ],
          },
        },
      });
    }

    console.log('Seed showroom: added NewCar reference entries.');
  }
}

main()
  .then(() => {
    console.log('Seed finished: cities, Honda/Toyota, default models, optional showroom specs.');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
