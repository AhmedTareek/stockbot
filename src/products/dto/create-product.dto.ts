import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsInt,
  IsPositive,
  ValidateNested,
  IsArray,
} from 'class-validator';

class InventoryItemDto {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  locationId: number;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  quantity: number;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsNotEmpty()
  price: number;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  reorder_point: number;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  categoryId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryItemDto)
  @IsOptional()
  inventories?: InventoryItemDto[];
}
