import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePostDto {
  @ApiProperty({ example: 'Hello World!' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class UpdatePostDto {
  @ApiPropertyOptional({ example: 'Updated content' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}

export class FeedQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @Transform(({ value }) => (value === undefined ? 1 : parseInt(value, 10)))
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @Transform(({ value }) => (value === undefined ? 10 : parseInt(value, 10)))
  @IsInt()
  @Min(1)
  @IsOptional()
  limit: number = 10;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsString()
  @IsOptional()
  search?: string;

  @IsOptional()
  @IsString()
  tab?: string;
}
