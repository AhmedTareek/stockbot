import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { Inventory } from 'src/inventory/entities/inventory.entity';
import { Product } from 'src/products/entities/product.entity';
import { Location } from 'src/locations/entities/location.entity';
import { ProductsService } from 'src/products/products.service';
import { InventoryService } from 'src/inventory/inventory.service';
import { CategoryToolsService } from './tools/category-tools.service';
import { LocationToolsService } from './tools/location-tools.service';
import { ProductToolsService } from './tools/product-tools.service';
import { InventoryToolsService } from './tools/inventory-tools.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([Category, Inventory, Location, Product]),
  ],
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    ProductsService,
    InventoryService,
    CategoryToolsService,
    LocationToolsService,
    ProductToolsService,
    InventoryToolsService,
  ],
})
export class ChatbotModule {}
