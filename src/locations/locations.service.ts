import { ConflictException, Injectable } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
  ) {}

  async create(createLocationDto: CreateLocationDto) {
    createLocationDto.location = createLocationDto.location.toLowerCase();
    const location = await this.locationRepository.findOne({
      where: {
        location: createLocationDto.location,
      },
    });
    if (location) {
      throw new ConflictException('Location already exists');
    }
    return this.locationRepository.save(createLocationDto);
  }

  findAll() {
    return this.locationRepository.find();
  }

  findOne(id: number) {
    return this.locationRepository.findOne({ where: { id } });
  }

  async update(id: number, updateLocationDto: UpdateLocationDto) {
    if (updateLocationDto.location) {
      updateLocationDto.location = updateLocationDto.location.toLowerCase();
    }
    await this.locationRepository.update(id, updateLocationDto);
    return this.findOne(id);
  }

  remove(id: number) {
    return this.locationRepository.delete(id);
  }
}
