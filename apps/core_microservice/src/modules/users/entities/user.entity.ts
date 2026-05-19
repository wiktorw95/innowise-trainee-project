import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class User {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'User', enum: ['User', 'Admin'] })
  role!: string;

  @ApiProperty({ example: false })
  disabled!: boolean;

  @ApiProperty()
  created_at!: Date;

  @ApiPropertyOptional()
  profile?: any;

  @ApiPropertyOptional({ isArray: true })
  accounts?: any[];
}
