import { Category } from 'src/categories/entities/category.entity';
import { Inventory } from 'src/inventory/entities/inventory.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn({ name: 'product_id' })
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  sku: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'double', precision: 10, scale: 2 })
  price: number;

  @Column()
  reorder_point: number;

  @ManyToOne(() => Category)
  category: Category;

  @OneToMany(() => Inventory, (inventory) => inventory.product)
  inventories: Inventory[];
}
