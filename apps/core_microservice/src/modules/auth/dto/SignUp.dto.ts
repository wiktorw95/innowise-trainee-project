import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ISignUpPayload } from '@innogram/types';

export class SignUpDto implements ISignUpPayload {
  @ApiProperty({ example: 'tester@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @ApiProperty({ example: 'test_warrior' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @ApiProperty({ example: '1995-05-20' })
  @IsDateString()
  @IsNotEmpty()
  birthday!: string;

  @ApiProperty({ example: 'https://example.com/avatar.png', required: false })
  @IsString()
  @IsOptional()
  profileImage?: string;
}
