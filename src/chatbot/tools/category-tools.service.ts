import { FunctionDeclaration, Type } from '@google/genai';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCategoryDto } from 'src/categories/dto/create-category.dto';
import { Category } from 'src/categories/entities/category.entity';
import { Product } from 'src/products/entities/product.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryToolsService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  getTools(): FunctionDeclaration[] {
    const functions: FunctionDeclaration[] = [
      {
        name: 'getAllCategories',
        description:
          'Gets the available categories names along with their IDs that are stored in the categories table',
      },
      {
        name: 'getProductsByCategoryId',
        description:
          'return the products(id, name, sku, description, price and reorder_point) or throw not found exception when the categoryId is not found',
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
        name: 'addCategory',
        description:
          'insert a new category into categories table returns true if its inserted and false if its already there',
        parameters: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
            },
          },
          required: ['category'],
        },
      },
      {
        name: 'removeCategory',
        description:
          'removes a category by id you should use getAllCategories method to get the id of the provided category returns true if removed and false if it cant be removed as there is a product depend on it',
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
      getAllCategories: this.getAllCategories.bind(this),
      getProductsByCategoryId: this.getProductsByCategoryId.bind(this),
      addCategory: this.addCategory.bind(this),
      removeCategory: this.removeCategory.bind(this),
    };
    /* eslint-enable @typescript-eslint/no-unsafe-assignment */
  }

  getAllCategories() {
    return this.categoryRepository.find();
  }

  async getProductsByCategoryId({ id }) {
    const CatId = Number(id);
    console.log(id);
    console.log(id);
    const category = await this.categoryRepository.findOne({
      where: { id: CatId },
    });
    if (category) {
      return this.productRepository.find({ where: { category: category } });
    }
    throw new NotFoundException(`category with ID ${id} not found`);
  }

  async addCategory(args: CreateCategoryDto) {
    const oldCat = await this.categoryRepository.findOne({
      where: { category: args.category },
    });
    if (oldCat) {
      return false;
    }
    const category = this.categoryRepository.create(args);
    await this.categoryRepository.save(category);
    return true;
  }

  async removeCategory({ id }) {
    const CatId = Number(id);
    // check if products depend on this id
    const products = await this.getProductsByCategoryId({ id: CatId });
    if (products.length > 0) {
      return false;
    }
    await this.categoryRepository.delete(CatId);
    return true;
  }
}
