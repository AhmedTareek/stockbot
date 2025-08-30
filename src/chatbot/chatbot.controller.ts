import { Body, Controller, Post } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('/message')
  processMessage(@Body() sendMessageDto: SendMessageDto) {
    return this.chatbotService.processMessage(
      sendMessageDto.message,
      sendMessageDto.conversationId,
    );
  }
}
