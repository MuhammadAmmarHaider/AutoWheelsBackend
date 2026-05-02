import {
    Controller,
    Get,
    Param,
    Query,
    ParseIntPipe,
    DefaultValuePipe,
    ParseArrayPipe,
  } from '@nestjs/common';
  import { NewCarService } from './new-car.service';
  import { GetNewCarsDto } from './dto';
  
  @Controller('new-cars')
  export class NewCarController {
    constructor(private readonly newCarService: NewCarService) {}
  
    // GET /new-cars
    // Query params: search, brandId, modelId, bodyType, fuelType,
    //               transmission, minPrice, maxPrice, year,
    //               page, limit, sortBy, sortOrder
    @Get()
    findAll(@Query() dto: GetNewCarsDto) {
      return this.newCarService.findAll(dto);
    }
  
    // GET /new-cars/featured?limit=10
    @Get('featured')
    findFeatured(
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    ) {
      return this.newCarService.findFeatured(limit);
    }
  
    // GET /new-cars/brands
    // Returns all brands with model list and car counts
    @Get('brands')
    findAllBrands() {
      return this.newCarService.findAllBrands();
    }
  
    // GET /new-cars/filters
    // Returns all available filter options for the frontend filter UI
    @Get('filters')
    getFilterOptions() {
      return this.newCarService.getFilterOptions();
    }
  
    // GET /new-cars/compare?ids=id1,id2,id3
    @Get('compare')
    compareCars(
      @Query('ids', new ParseArrayPipe({ items: String, separator: ',' }))
      ids: string[],
    ) {
      return this.newCarService.compareCars(ids);
    }
  
    // GET /new-cars/brands/:brandId
    // Returns brand info + all cars under it
    @Get('brands/:brandId')
    findByBrand(
      @Param('brandId') brandId: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    ) {
      return this.newCarService.findByBrand(brandId, page, limit);
    }
  
    // GET /new-cars/brands/:brandId/models
    // Returns all models under a brand with car counts
    @Get('brands/:brandId/models')
    findModelsByBrand(@Param('brandId') brandId: string) {
      return this.newCarService.findModelsByBrand(brandId);
    }
  
    // GET /new-cars/models/:modelId
    // Returns model info + all car variants under it (full details)
    @Get('models/:modelId')
    findByModel(@Param('modelId') modelId: string) {
      return this.newCarService.findByModel(modelId);
    }
  
    // GET /new-cars/:id/similar
    @Get(':id/similar')
    findSimilar(
      @Param('id') id: string,
      @Query('limit', new DefaultValuePipe(6), ParseIntPipe) limit: number,
    ) {
      return this.newCarService.findSimilar(id, limit);
    }
  
    // GET /new-cars/:id  (full details — keep last to avoid route conflicts)
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.newCarService.findOne(id);
    }
  }