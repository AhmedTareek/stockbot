import { IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  conversationId?: string;
}
