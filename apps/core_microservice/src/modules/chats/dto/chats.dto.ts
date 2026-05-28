import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CreatePrivateChatDto {
  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @IsNotEmpty()
  targetUsername!: string;
}

export class CreateGroupChatDto {
  @ApiProperty({ example: 'Weekend Project' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Discussing our new app' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: ['johndoe', 'janedoe'] })
  @IsArray()
  @IsString({ each: true })
  participantUsernames!: string[];
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsUUID()
  @IsOptional()
  replyToMessageId?: string;
}

export class UpdateMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}
