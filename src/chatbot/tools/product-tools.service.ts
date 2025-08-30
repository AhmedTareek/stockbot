import { FunctionDeclaration, Type } from '@google/genai';
import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { CreateProductDto } from 'src/products/dto/create-product.dto';
import { UpdateProductDto } from 'src/products/dto/update-product.dto';

@Injectable()
export class ProductToolsService {
  constructor(private productsService: ProductsService) {}

  getTools(): FunctionDeclaration[] {
    const functions: FunctionDeclaration[] = [
      {
        name: 'getAllProducts',
        description:
          'Gets all products from the database with basic information (id, name, sku, price, description, reorder_point)',
      },
      {
        name: 'getProductById',
        description:
          'Gets detailed information about a specific product by its ID, including category and inventory information',
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.NUMBER,
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'createProduct',
        description:
          'Creates a new product with the specified details. Returns the created product with complete details',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: 'Product name',
            },
            sku: {
              type: Type.STRING,
              description:
                'Stock keeping unit, a unique identifier for the product',
            },
            description: {
              type: Type.STRING,
              description: 'Product description (optional)',
            },
            price: {
              type: Type.NUMBER,
              description: 'Product price (must be positive)',
            },
            reorder_point: {
              type: Type.NUMBER,
              description:
                'The stock level at which the product should be reordered',
            },
            categoryId: {
              type: Type.NUMBER,
              description: 'ID of the category this product belongs to',
            },
            inventories: {
              type: Type.ARRAY,
              description:
                'Optional initial inventory quantities at different locations',
              items: {
                type: Type.OBJECT,
                properties: {
                  locationId: {
                    type: Type.NUMBER,
                    description: 'ID of the location',
                  },
                  quantity: {
                    type: Type.NUMBER,
                    description: 'Quantity at this location',
                  },
                },
              },
            },
          },
          required: ['name', 'sku', 'price', 'reorder_point', 'categoryId'],
        },
      },
      {
        name: 'updateProduct',
        description:
          'Updates an existing product. All fields are optional except the product ID. Returns the updated product',
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.NUMBER,
              description: 'ID of the product to update',
            },
            name: {
              type: Type.STRING,
              description: 'New product name (optional)',
            },
            sku: {
              type: Type.STRING,
              description: 'New SKU (optional)',
            },
            description: {
              type: Type.STRING,
              description: 'New product description (optional)',
            },
            price: {
              type: Type.NUMBER,
              description: 'New product price (optional)',
            },
            reorder_point: {
              type: Type.NUMBER,
              description: 'New reorder point (optional)',
            },
            categoryId: {
              type: Type.NUMBER,
              description: 'New category ID (optional)',
            },
            inventories: {
              type: Type.ARRAY,
              description: 'Updated inventory quantities (optional)',
              items: {
                type: Type.OBJECT,
                properties: {
                  locationId: {
                    type: Type.NUMBER,
                    description: 'ID of the location',
                  },
                  quantity: {
                    type: Type.NUMBER,
                    description: 'New quantity at this location',
                  },
                },
              },
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'removeProduct',
        description:
          'Removes a product by ID. Automatically removes all inventory entries for this product. Returns true if successful',
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.NUMBER,
              description: 'ID of the product to remove',
            },
          },
          required: ['id'],
        },
      },
    ];
    return functions;
  }

  getToolFunctions(): Record<string, any> {
    return {
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      getAllProducts: this.getAllProducts.bind(this),
      getProductById: this.getProductById.bind(this),
      createProduct: this.createProduct.bind(this),
      updateProduct: this.updateProduct.bind(this),
      removeProduct: this.removeProduct.bind(this),
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    };
  }

  async getAllProducts() {
    return await this.productsService.findAll();
  }

  async getProductById({ id }) {
    const productId = Number(id);
    return await this.productsService.findOne(productId);
  }

  async createProduct(args: CreateProductDto) {
    return await this.productsService.create(args);
  }

  async updateProduct(args: UpdateProductDto & { id: number }) {
    const id = args.id;
    return await this.productsService.update(id, args);
  }

  async removeProduct({ id }) {
    const productId = Number(id);
    await this.productsService.remove(productId);
    return true;
  }
}
