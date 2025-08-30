import { Location } from 'src/locations/entities/location.entity';
import { Product } from 'src/products/entities/product.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
} from 'typeorm';

@Entity('inventories')
@Unique(['product', 'location'])
export class Inventory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, (product) => product.inventories)
  product: Product;

  @ManyToOne(() => Location)
  location: Location;

  @Column()
  quantity: number;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  last_updated: Date;
}
