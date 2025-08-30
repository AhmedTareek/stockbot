import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Location } from '../locations/entities/location.entity';
import { Inventory } from '../inventory/entities/inventory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, Location, Inventory])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
