import { FunctionDeclaration, Type } from '@google/genai';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from 'src/locations/entities/location.entity';
import { CreateLocationDto } from 'src/locations/dto/create-location.dto';
import { Repository } from 'typeorm';
import { Inventory } from 'src/inventory/entities/inventory.entity';

@Injectable()
export class LocationToolsService {
  constructor(
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
  ) {}

  getTools(): FunctionDeclaration[] {
    const functions: FunctionDeclaration[] = [
      {
        name: 'getAllLocations',
        description:
          'Gets the available locations names along with their IDs that are stored in the locations table',
      },
      {
        name: 'addLocation',
        description:
          'insert a new location into locations table returns location object if its inserted and false if its already there',
        parameters: {
          type: Type.OBJECT,
          properties: {
            location: {
              type: Type.STRING,
            },
          },
          required: ['location'],
        },
      },
      {
        name: 'removeLocation',
        description:
          'removes a location by id you should use getAllLocations method to get the id of the provided location returns true if removed and false if it cant be removed as there is inventory items depend on it',
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
    ];
    return functions;
  }

  getToolFunctions(): Record<string, any> {
    return {
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      getAllLocations: this.getAllLocations.bind(this),
      addLocation: this.addLocation.bind(this),
      removeLocation: this.removeLocation.bind(this),
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    };
  }

  getAllLocations() {
    return this.locationRepository.find();
  }

  async addLocation(args: CreateLocationDto) {
    const oldLocation = await this.locationRepository.findOne({
      where: { location: args.location },
    });
    if (oldLocation) {
      return false;
    }
    const location = this.locationRepository.create(args);
    return this.locationRepository.save(location);
  }

  async removeLocation({ id }) {
    const LocId = Number(id);
    // check if inventories depend on this location
    const location = await this.locationRepository.findOne({
      where: { id: LocId },
    });

    if (!location) {
      return false;
    }

    const inventories = await this.inventoryRepository.find({
      where: { location: { id: LocId } },
    });

    if (inventories.length > 0) {
      return false;
    }

    await this.locationRepository.delete(LocId);
    return true;
  }
}
