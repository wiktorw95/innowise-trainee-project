import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great post!' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({
    description: 'ID of parent comment if replying',
    example: null,
  })
  @IsUUID()
  @IsOptional()
  parentCommentId?: string;
}

export class UpdateCommentDto {
  @ApiProperty({ example: 'Edited comment content' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
