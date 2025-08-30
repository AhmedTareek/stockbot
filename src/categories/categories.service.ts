import { ConflictException, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}
  async create(createCategoryDto: CreateCategoryDto) {
    createCategoryDto.category = createCategoryDto.category.toLowerCase();
    const category = await this.categoryRepository.findOne({
      where: {
        category: createCategoryDto.category,
      },
    });
    if (category) {
      throw new ConflictException('Category already exists');
    }
    return this.categoryRepository.save(createCategoryDto);
  }

  findAll() {
    return this.categoryRepository.find();
  }

  findOne(id: number) {
    return this.categoryRepository.findOne({ where: { id } });
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    updateCategoryDto.category = updateCategoryDto.category?.toLowerCase();
    await this.categoryRepository.update(id, updateCategoryDto);
    return this.findOne(id);
  }

  remove(id: number) {
    return this.categoryRepository.delete(id);
  }
}
