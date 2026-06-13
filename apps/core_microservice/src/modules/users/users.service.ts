import {
  ConflictException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { Prisma, PrismaService, AppLogger } from '@innogram/shared';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto, adminId?: string) {
    const ctx = 'UsersService:Create';
    AppLogger.info(`Provisioning new user: ${dto.email}`, ctx);

    try {
      const tempPassword = dto.password || 'TempPassword123!';
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const creator = adminId || undefined;

      let parsedDate = new Date('2000-01-01');
      if (dto.birthday) {
        parsedDate = new Date(dto.birthday);
        if (isNaN(parsedDate.getTime())) {
          AppLogger.warn(`Invalid birthday provided for ${dto.email}`, ctx);
          throw new BadRequestException(
            'Invalid birthday date format provided.',
          );
        }
      }

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
              birthday: parsedDate,
              created_by: creator,
            },
          },
        },
        include: {
          profile: true,
          accounts: { select: { id: true, email: true, provider: true } },
        },
      });

      AppLogger.success(
        `Successfully created user: ${newUser.id} (${dto.email})`,
        ctx,
      );
      return newUser;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = (error.meta?.target as string[])?.join(', ') || 'field';
        AppLogger.warn(
          `Creation failed: Conflict on ${target} for ${dto.email}`,
          ctx,
        );
        throw new ConflictException(
          `A record with this ${target} already exists.`,
        );
      }
      if (error instanceof BadRequestException) throw error;

      AppLogger.error(`Failed to provision user ${dto.email}`, error, ctx);
      throw new InternalServerErrorException('Failed to create user account');
    }
  }

  async findAll() {
    AppLogger.debug('Fetching all users', null, 'UsersService:FindAll');
    return await this.prisma.user.findMany({
      include: {
        profile: true,
        accounts: { select: { id: true, email: true, provider: true } },
      },
    });
  }

  async findOne(id: string) {
    AppLogger.debug(`Fetching user: ${id}`, null, 'UsersService:FindOne');

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        accounts: { select: { id: true, email: true, provider: true } },
      },
    });

    if (!user) {
      AppLogger.warn(
        `User lookup failed: ${id} not found`,
        'UsersService:FindOne',
      );
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const postCount = user.profile
      ? await this.prisma.post.count({ where: { profileId: user.profile.id } })
      : 0;

    return {
      ...user,
      _count: {
        posts: postCount,
      },
    };
  }

  async update(id: string, dto: UpdateUserDto) {
    AppLogger.info(`Updating user: ${id}`, 'UsersService:Update');
    return this.prisma.user.update({
      where: { id },
      data: dto,
      include: {
        profile: true,
        accounts: { select: { id: true, email: true, provider: true } },
      },
    });
  }

  async remove(id: string) {
    AppLogger.info(`Removing user: ${id}`, 'UsersService:Remove');
    await this.findOne(id); // Ensures user exists
    const deleted = await this.prisma.user.delete({ where: { id } });
    AppLogger.success(
      `Successfully deleted user: ${id}`,
      'UsersService:Remove',
    );
    return deleted;
  }
  async updateProfile(
    userId: string,
    updateData: { displayName?: string; bio?: string },
  ) {
    return this.prisma.profile.update({
      where: { userId: userId },
      data: {
        displayName: updateData.displayName,
        bio: updateData.bio,
      },
    });
  }

  async searchUsers(query: string) {
    if (!query) return [];

    return this.prisma.profile.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });
  }
}
