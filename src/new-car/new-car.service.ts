import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetNewCarsDto } from './dto';

// Full include object — reused across queries
const NEW_CAR_FULL_INCLUDE = {
  brand: { select: { id: true, name: true, country: true } },
  model: { select: { id: true, name: true } },
  dimensions: true,
  engineDetails: true,
  transmissionDetails: true,
  steering: true,
  suspension: true,
  wheels: true,
  fuelEconomy: true,
  images: { select: { id: true, url: true } },
};

// Light include for list views (no heavy sub-tables)
const NEW_CAR_LIST_INCLUDE = {
  brand: { select: { id: true, name: true, country: true } },
  model: { select: { id: true, name: true } },
  images: { select: { id: true, url: true }, take: 1 },
};

@Injectable()
export class NewCarService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── GET ALL CARS (with filters + pagination) ────────────────
  async findAll(dto: GetNewCarsDto) {
    const {
      search,
      brandId,
      modelId,
      bodyType,
      fuelType,
      transmission,
      minPrice,
      maxPrice,
      year,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = dto;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { name: { contains: search, mode: 'insensitive' } } },
        { model: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (brandId)      where.brandId      = brandId;
    if (modelId)      where.modelId      = modelId;
    if (bodyType)     where.bodyType     = { equals: bodyType, mode: 'insensitive' };
    if (fuelType)     where.fuelType     = fuelType;
    if (transmission) where.transmission = transmission;
    if (year)         where.year         = year;

    if (minPrice || maxPrice) {
      where.priceMin = {};
      if (minPrice) where.priceMin.gte = minPrice;
      if (maxPrice) where.priceMin.lte = maxPrice;
    }

    const [cars, total] = await Promise.all([
      this.prisma.newCar.findMany({
        where,
        include: NEW_CAR_LIST_INCLUDE,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.newCar.count({ where }),
    ]);

    return {
      data: cars,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  // ─── GET SINGLE CAR (full details) ───────────────────────────
  async findOne(id: string) {
    const car = await this.prisma.newCar.findUnique({
      where: { id },
      include: NEW_CAR_FULL_INCLUDE,
    });

    if (!car) throw new NotFoundException(`Car with id ${id} not found`);
    return car;
  }

  // ─── GET FEATURED CARS ────────────────────────────────────────
  async findFeatured(limit = 10) {
    return this.prisma.newCar.findMany({
      where: { featured: true },
      include: NEW_CAR_LIST_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ─── GET CARS BY BRAND ────────────────────────────────────────
  async findByBrand(brandId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true, name: true, country: true },
    });

    if (!brand) throw new NotFoundException(`Brand with id ${brandId} not found`);

    const [cars, total] = await Promise.all([
      this.prisma.newCar.findMany({
        where: { brandId },
        include: NEW_CAR_LIST_INCLUDE,
        orderBy: { priceMin: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.newCar.count({ where: { brandId } }),
    ]);

    return {
      brand,
      data: cars,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  // ─── GET CARS BY MODEL ────────────────────────────────────────
  async findByModel(modelId: string) {
    const model = await this.prisma.carModel.findUnique({
      where: { id: modelId },
      include: { brand: { select: { id: true, name: true } } },
    });

    if (!model) throw new NotFoundException(`Model with id ${modelId} not found`);

    const cars = await this.prisma.newCar.findMany({
      where: { modelId },
      include: NEW_CAR_FULL_INCLUDE,
      orderBy: { priceMin: 'asc' },
    });

    return { model, data: cars };
  }

  // ─── GET ALL BRANDS (with car counts) ────────────────────────
  async findAllBrands() {
    const brands = await this.prisma.brand.findMany({
      include: {
        _count: { select: { newCars: true } },
        models: {
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return brands.map((b) => ({
      id: b.id,
      name: b.name,
      country: b.country,
      totalCars: b._count.newCars,
      models: b.models,
    }));
  }

  // ─── GET MODELS BY BRAND ─────────────────────────────────────
  async findModelsByBrand(brandId: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true, name: true, country: true },
    });

    if (!brand) throw new NotFoundException(`Brand with id ${brandId} not found`);

    const models = await this.prisma.carModel.findMany({
      where: { brandId },
      include: {
        _count: { select: { newCars: true } },
      },
      orderBy: { name: 'asc' },
    });

    return {
      brand,
      models: models.map((m) => ({
        id: m.id,
        name: m.name,
        totalCars: m._count.newCars,
      })),
    };
  }

  // ─── GET FILTER OPTIONS (for frontend filter UI) ─────────────
  async getFilterOptions() {
    const [brands, bodyTypes, years, priceRange] = await Promise.all([
      this.prisma.brand.findMany({
        where: { newCars: { some: {} } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.newCar.findMany({
        select: { bodyType: true },
        distinct: ['bodyType'],
        orderBy: { bodyType: 'asc' },
      }),
      this.prisma.newCar.findMany({
        select: { year: true },
        distinct: ['year'],
        orderBy: { year: 'desc' },
      }),
      this.prisma.newCar.aggregate({
        _min: { priceMin: true },
        _max: { priceMax: true },
      }),
    ]);

    return {
      brands,
      bodyTypes: bodyTypes.map((b) => b.bodyType).filter(Boolean),
      years: years.map((y) => y.year),
      fuelTypes: ['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC'],
      transmissions: ['MANUAL', 'AUTOMATIC'],
      priceRange: {
        min: priceRange._min.priceMin ?? 0,
        max: priceRange._max.priceMax ?? 0,
      },
    };
  }

  // ─── COMPARE CARS ─────────────────────────────────────────────
  async compareCars(ids: string[]) {
    if (ids.length < 2 || ids.length > 4) {
      throw new NotFoundException('Please provide between 2 and 4 car IDs to compare');
    }

    const cars = await this.prisma.newCar.findMany({
      where: { id: { in: ids } },
      include: NEW_CAR_FULL_INCLUDE,
    });

    if (cars.length !== ids.length) {
      throw new NotFoundException('One or more car IDs not found');
    }

    return cars;
  }

  // ─── SIMILAR CARS ─────────────────────────────────────────────
  async findSimilar(id: string, limit = 6) {
    const car = await this.prisma.newCar.findUnique({
      where: { id },
      select: { brandId: true, bodyType: true, fuelType: true, priceMin: true },
    });

    if (!car) throw new NotFoundException(`Car with id ${id} not found`);

    // Find cars with same body type or brand, excluding self
    const similar = await this.prisma.newCar.findMany({
      where: {
        id: { not: id },
        OR: [
          { brandId: car.brandId },
          { bodyType: car.bodyType },
          { fuelType: car.fuelType },
        ],
      },
      include: NEW_CAR_LIST_INCLUDE,
      orderBy: { priceMin: 'asc' },
      take: limit,
    });

    return similar;
  }
}