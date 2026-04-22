import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { Prisma, PrismaService } from '@innogram/shared';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto, adminId?: string) {
    try {
      const tempPassword = dto.password || 'TempPassword123!';
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const creator = adminId || undefined;

      const newUser = await this.prisma.user.create({
        data: {
          role: dto.role || 'User',
          disabled: dto.disabled || false,
          created_by: creator,

          accounts: {
            create: {
              email: dto.email,
              password_hash: hashedPassword,
              provider: 'local',
              provider_id: dto.email,
              last_login_at: new Date(),
              created_by: creator,
            },
          },

          profile: {
            create: {
              username: dto.username,
              displayName: dto.displayName || dto.username,
              birthday: dto.birthday
                ? new Date(dto.birthday)
                : new Date('2000-01-01'),
              created_by: creator,
            },
          },
        },
        include: {
          profile: true,
          accounts: {
            select: { id: true, email: true, provider: true },
          },
        },
      });

      this.logger.log(`Successfully created user with ID: ${newUser.id}`);
      return newUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target =
            (error.meta?.target as string[])?.join(', ') || 'field';
          this.logger.warn(`Failed to create user: Conflict on ${target}`);
          throw new ConflictException(
            `A record with this ${target} already exists.`,
          );
        }
      }
      this.logger.error('Failed to provision user', error);
      throw new InternalServerErrorException('Failed to create user account');
    }
  }

  async findAll() {
    return await this.prisma.user.findMany({
      include: {
        profile: true,
        accounts: {
          select: { id: true, email: true, provider: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        accounts: {
          select: { id: true, email: true, provider: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      include: {
        profile: true,
        accounts: {
          select: { id: true, email: true, provider: true },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
