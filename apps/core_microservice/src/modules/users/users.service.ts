import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Prisma } from '../../../generated/prisma/client.js';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const newUser = await this.prisma.user.create({
        data: createUserDto,
      });
      this.logger.log(`Successfully created user with ID: ${newUser.id}`);
      return newUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          this.logger.warn(
            `Failed to create user: Email ${createUserDto.email} already exists.`,
          );
          throw new ConflictException('A user with this email already exists.');
        }
      }

      // Catch-all for unexpected database failures
      this.logger.error(`Failed to create user: ${error}`);
      throw new InternalServerErrorException('An unexpected error occurred.');
    }
  }

  async findAll() {
    this.logger.log('Fetching all users from the database');
    try {
      return this.prisma.user.findMany();
    } catch (error) {
      this.logger.error(`Failed to fetch users: ${error}`);
      throw new InternalServerErrorException('Could not retrieve users.');
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        this.logger.warn(`User with ID ${id} not found.`);
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(`Error fetching user ${id}: ${error}`);
      throw new InternalServerErrorException('Could not retrieve the user.');
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });
      this.logger.log(`Successfully updated user with ID: ${id}`);
      return updatedUser;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.warn(`Update failed: Email already in use.`);
        throw new ConflictException('This email is already taken.');
      }

      this.logger.error(`Failed to update user ${id}: ${error}`);
      throw new InternalServerErrorException(
        'An error occurred while updating the user.',
      );
    }
  }

  async findByEmail(email: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        this.logger.warn(`User with email ${email} not found.`);
        throw new NotFoundException(`User with email ${email} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(`Error fetching user by email ${email}: ${error}`);
      throw new InternalServerErrorException('Could not retrieve the user.');
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      await this.prisma.user.delete({
        where: { id },
      });
      this.logger.log(`Successfully deleted user with ID: ${id}`);
      return { message: `User with ID ${id} successfully deleted` };
    } catch (error) {
      this.logger.error(`Failed to delete user ${id}: ${error}`);
      throw new InternalServerErrorException(
        'An error occurred while deleting the user.',
      );
    }
  }
}
