import { FunctionDeclaration, Type } from '@google/genai';
import { Injectable } from '@nestjs/common';
import { InventoryService } from 'src/inventory/inventory.service';
import { CreateInventoryDto } from 'src/inventory/dto/create-inventory.dto';
import { UpdateInventoryDto } from 'src/inventory/dto/update-inventory.dto';

@Injectable()
export class InventoryToolsService {
  constructor(private inventoryService: InventoryService) {}

  getTools(): FunctionDeclaration[] {
    const functions: FunctionDeclaration[] = [
      {
        name: 'getAllInventories',
        description:
          'Gets all inventory records from the database with product and location information',
      },
      {
        name: 'getInventoryById',
        description:
          'Gets detailed information about a specific inventory record by its ID, including product and location details',
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.NUMBER,
              description: 'ID of the inventory record to retrieve',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'createInventory',
        description:
          'Creates a new inventory record with the specified details. Returns the created inventory record with complete details',
        parameters: {
          type: Type.OBJECT,
          properties: {
            productId: {
              type: Type.NUMBER,
              description: 'ID of the product for this inventory record',
            },
            locationId: {
              type: Type.NUMBER,
              description: 'ID of the location for this inventory record',
            },
            quantity: {
              type: Type.NUMBER,
              description:
                'The quantity of the product at this location (must be non-negative)',
            },
          },
          required: ['productId', 'locationId', 'quantity'],
        },
      },
      {
        name: 'updateInventory',
        description:
          'Updates an existing inventory record. All fields are optional except the inventory ID. Returns the updated inventory record',
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.NUMBER,
              description: 'ID of the inventory record to update',
            },
            productId: {
              type: Type.NUMBER,
              description: 'New product ID (optional)',
            },
            locationId: {
              type: Type.NUMBER,
              description: 'New location ID (optional)',
            },
            quantity: {
              type: Type.NUMBER,
              description: 'New quantity (optional)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'removeInventory',
        description:
          'Removes an inventory record by ID. Returns true if successful',
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.NUMBER,
              description: 'ID of the inventory record to remove',
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
      getAllInventories: this.getAllInventories.bind(this),
      getInventoryById: this.getInventoryById.bind(this),
      createInventory: this.createInventory.bind(this),
      updateInventory: this.updateInventory.bind(this),
      removeInventory: this.removeInventory.bind(this),
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    };
  }

  async getAllInventories() {
    return await this.inventoryService.findAll();
  }

  async getInventoryById({ id }) {
    const inventoryId = Number(id);
    return await this.inventoryService.findOne(inventoryId);
  }

  async createInventory(args: CreateInventoryDto) {
    return await this.inventoryService.create(args);
  }

  async updateInventory(args: UpdateInventoryDto & { id: number }) {
    const id = args.id;
    return await this.inventoryService.update(id, args);
  }

  async removeInventory({ id }) {
    const inventoryId = Number(id);
    await this.inventoryService.remove(inventoryId);
    return true;
  }
}
