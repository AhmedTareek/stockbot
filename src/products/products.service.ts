import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Location } from '../locations/entities/location.entity';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const existingProduct = await this.productRepository.findOne({
      where: { sku: createProductDto.sku },
    });

    if (existingProduct) {
      throw new ConflictException(
        `Product with SKU ${createProductDto.sku} already exists`,
      );
    }

    const category = await this.categoryRepository.findOne({
      where: { id: createProductDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${createProductDto.categoryId} not found`,
      );
    }

    return await this.productRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const product = this.productRepository.create({
          name: createProductDto.name,
          sku: createProductDto.sku,
          description: createProductDto.description,
          price: createProductDto.price,
          reorder_point: createProductDto.reorder_point,
          category,
        });

        const savedProduct = await transactionalEntityManager.save(product);

        if (
          createProductDto.inventories &&
          createProductDto.inventories.length > 0
        ) {
          const locationIds = createProductDto.inventories.map(
            (item) => item.locationId,
          );

          const locations = await transactionalEntityManager.find(Location, {
            where: locationIds.map((id) => ({ id })),
          });

          // Check if all locations were found
          if (locations.length !== locationIds.length) {
            // Find which locationIds were not found
            const foundIds = new Set(locations.map((loc) => loc.id));
            const missingIds = locationIds.filter((id) => !foundIds.has(id));

            throw new NotFoundException(
              `Locations with IDs ${missingIds.join(', ')} not found`,
            );
          }

          // Create inventory entries with validated locations
          const inventories = await Promise.all(
            createProductDto.inventories.map((inventoryItem) => {
              const location = locations.find(
                (loc) => loc.id === inventoryItem.locationId,
              );

              return this.inventoryRepository.create({
                product: savedProduct,
                location,
                quantity: inventoryItem.quantity,
              });
            }),
          );

          // Save all inventory items in batch
          await transactionalEntityManager.save(inventories);
        }

        // Return the complete product with relations
        return await transactionalEntityManager.findOne(Product, {
          where: { id: savedProduct.id },
          relations: ['category', 'inventories', 'inventories.location'],
        });
      },
    );
  }

  async findAll() {
    return await this.productRepository.find();
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne({
      where: { id: id },
      relations: ['category', 'inventories', 'inventories.location'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    // Check if product exists
    const product = await this.productRepository.findOne({
      where: { id: id },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check if SKU is being updated and if the new SKU is already in use
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingProduct = await this.productRepository.findOne({
        where: { sku: updateProductDto.sku },
      });

      if (existingProduct && existingProduct.id !== id) {
        throw new ConflictException(
          `Product with SKU ${updateProductDto.sku} already exists`,
        );
      }
    }

    // Use a transaction to ensure atomicity of the update operation
    return await this.productRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // Clone product for transaction context
        const productToUpdate = { ...product };

        // Update category if needed
        if (updateProductDto.categoryId) {
          const category = await transactionalEntityManager.findOne(Category, {
            where: { id: updateProductDto.categoryId },
          });

          if (!category) {
            throw new NotFoundException(
              `Category with ID ${updateProductDto.categoryId} not found`,
            );
          }

          productToUpdate.category = category;
        }

        // Update other fields
        if (updateProductDto.name) productToUpdate.name = updateProductDto.name;
        if (updateProductDto.sku) productToUpdate.sku = updateProductDto.sku;
        if (updateProductDto.description)
          productToUpdate.description = updateProductDto.description;
        if (updateProductDto.price)
          productToUpdate.price = updateProductDto.price;
        if (updateProductDto.reorder_point)
          productToUpdate.reorder_point = updateProductDto.reorder_point;

        // Save the updated product
        const savedProduct = await transactionalEntityManager.save(
          plainToInstance(Product, productToUpdate),
        );

        // Update inventory if provided
        if (
          updateProductDto.inventories &&
          updateProductDto.inventories.length > 0
        ) {
          // Validate all locations in one batch for efficiency
          const locationIds = updateProductDto.inventories.map(
            (item) => item.locationId,
          );

          // Find all locations in one query
          const locations = await transactionalEntityManager.find(Location, {
            where: locationIds.map((locId) => ({ id: locId })),
          });

          // Check if all locations were found
          if (locations.length !== new Set(locationIds).size) {
            // Find which locationIds were not found
            const foundIds = new Set(locations.map((loc) => loc.id));
            const missingIds = locationIds.filter((id) => !foundIds.has(id));

            throw new NotFoundException(
              `Locations with IDs ${missingIds.join(', ')} not found`,
            );
          }

          // Process each inventory item as a batch
          const inventoryUpdates = await Promise.all(
            updateProductDto.inventories.map(async (inventoryItem) => {
              const location = locations.find(
                (loc) => loc.id === inventoryItem.locationId,
              );

              // Check if inventory for this product and location already exists
              const inventory = await transactionalEntityManager.findOne(
                Inventory,
                {
                  where: {
                    product: { id: id },
                    location: { id: inventoryItem.locationId },
                  },
                },
              );

              if (inventory) {
                // Update existing inventory
                inventory.quantity = inventoryItem.quantity;
                return inventory;
              } else {
                // Create new inventory entry
                return this.inventoryRepository.create({
                  product: savedProduct,
                  location,
                  quantity: inventoryItem.quantity,
                });
              }
            }),
          );

          // Save all inventory items in a single batch
          await transactionalEntityManager.save(inventoryUpdates);
        }

        // Return the complete updated product with relations
        return await transactionalEntityManager.findOne(Product, {
          where: { id: id },
          relations: ['category', 'inventories', 'inventories.location'],
        });
      },
    );
  }

  async remove(id: number) {
    const product = await this.productRepository.findOne({
      where: { id: id },
      relations: ['inventories'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Use transaction to ensure atomicity when deleting product and its inventories
    return await this.productRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // Delete all inventory items first
        if (product.inventories && product.inventories.length > 0) {
          await transactionalEntityManager.remove(product.inventories);
        }

        // Then delete the product
        await transactionalEntityManager.remove(product);
        return;
      },
    );
  }
}
