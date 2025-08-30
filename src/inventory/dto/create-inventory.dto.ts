import { IsInt, IsNotEmpty, IsPositive, Min } from 'class-validator';

export class CreateInventoryDto {
  @IsInt()
  @IsNotEmpty()
  @IsPositive()
  productId: number;

  @IsInt()
  @IsNotEmpty()
  @IsPositive()
  locationId: number;

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  quantity: number;
}
