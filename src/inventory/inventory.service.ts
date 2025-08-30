import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Inventory } from './entities/inventory.entity';
import { Product } from '../products/entities/product.entity';
import { Location } from '../locations/entities/location.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
  ) {}

  async create(createInventoryDto: CreateInventoryDto) {
    const product = await this.productRepository.findOne({
      where: { id: createInventoryDto.productId },
    });
    if (!product) {
      throw new NotFoundException(
        `Product with ID ${createInventoryDto.productId} not found`,
      );
    }

    const location = await this.locationRepository.findOne({
      where: { id: createInventoryDto.locationId },
    });
    if (!location) {
      throw new NotFoundException(
        `Location with ID ${createInventoryDto.locationId} not found`,
      );
    }

    const existingInventory = await this.inventoryRepository.findOne({
      where: {
        product: { id: createInventoryDto.productId },
        location: { id: createInventoryDto.locationId },
      },
    });

    if (existingInventory) {
      throw new ConflictException(
        'Inventory for this product at this location already exists',
      );
    }

    const inventory = new Inventory();
    inventory.product = product;
    inventory.location = location;
    inventory.quantity = createInventoryDto.quantity;

    return this.inventoryRepository.save(inventory);
  }

  findAll() {
    return this.inventoryRepository.find({
      relations: ['product', 'location'],
    });
  }

  async findOne(id: number) {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['product', 'location'],
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    return inventory;
  }

  async update(id: number, updateInventoryDto: UpdateInventoryDto) {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['product', 'location'],
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    // Check if we're updating product
    if (
      updateInventoryDto.productId &&
      updateInventoryDto.productId !== inventory.product.id
    ) {
      const product = await this.productRepository.findOne({
        where: { id: updateInventoryDto.productId },
      });

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${updateInventoryDto.productId} not found`,
        );
      }

      inventory.product = product;
    }

    // Check if we're updating location
    if (
      updateInventoryDto.locationId &&
      updateInventoryDto.locationId !== inventory.location.id
    ) {
      const location = await this.locationRepository.findOne({
        where: { id: updateInventoryDto.locationId },
      });

      if (!location) {
        throw new NotFoundException(
          `Location with ID ${updateInventoryDto.locationId} not found`,
        );
      }
      inventory.location = location;
    }

    // Check if changing product/location would create a duplicate
    if (updateInventoryDto.productId || updateInventoryDto.locationId) {
      const productId = updateInventoryDto.productId || inventory.product.id;

      const locationId = updateInventoryDto.locationId || inventory.location.id;

      const existingInventory = await this.inventoryRepository.findOne({
        where: {
          product: { id: productId },
          location: { id: locationId },
        },
      });

      if (existingInventory && existingInventory.id !== id) {
        throw new ConflictException(
          'Inventory for this product at this location already exists',
        );
      }
    }

    // Update quantity if provided
    if (updateInventoryDto.quantity !== undefined) {
      inventory.quantity = updateInventoryDto.quantity;
    }

    return this.inventoryRepository.save(inventory);
  }

  async remove(id: number) {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    return this.inventoryRepository.remove(inventory);
  }
}
