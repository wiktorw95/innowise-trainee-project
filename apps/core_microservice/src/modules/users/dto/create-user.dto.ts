import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SuperSecret123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @ApiProperty({ example: '2000-01-01' })
  @IsDateString()
  @IsNotEmpty()
  birthday!: string;

  @ApiPropertyOptional({
    example: 'Admin',
    description: 'User role (defaults to User)',
  })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Is the user account disabled?',
  })
  @IsBoolean()
  @IsOptional()
  disabled?: boolean;
}
