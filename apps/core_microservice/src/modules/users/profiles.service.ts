import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@innogram/shared';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  private async getProfileByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async followUser(currentUserId: string, targetUsername: string) {
    const currentUserProfile = await this.getProfileByUserId(currentUserId);
    const targetProfile = await this.prisma.profile.findUnique({
      where: { username: targetUsername },
    });

    if (!targetProfile) throw new NotFoundException('Target profile not found');
    if (currentUserProfile.id === targetProfile.id)
      throw new BadRequestException('Cannot follow yourself');

    const existingFollow = await this.prisma.profiles_Follows.findUnique({
      where: {
        follower_profile_id_followed_profile_id: {
          follower_profile_id: currentUserProfile.id,
          followed_profile_id: targetProfile.id,
        },
      },
    });

    if (existingFollow)
      throw new BadRequestException('Already following or requested');

    const accepted = targetProfile.isPublic;

    await this.prisma.profiles_Follows.create({
      data: {
        follower_profile_id: currentUserProfile.id,
        followed_profile_id: targetProfile.id,
        accepted,
        created_by: currentUserId,
      },
    });
    return { status: accepted ? 'following' : 'requested' };
  }

  async unfollowUser(currentUserId: string, targetUsername: string) {
    const currentUserProfile = await this.getProfileByUserId(currentUserId);
    const targetProfile = await this.prisma.profile.findUnique({
      where: { username: targetUsername },
    });

    if (!targetProfile) throw new NotFoundException('Target profile not found');

    await this.prisma.profiles_Follows
      .delete({
        where: {
          follower_profile_id_followed_profile_id: {
            follower_profile_id: currentUserProfile.id,
            followed_profile_id: targetProfile.id,
          },
        },
      })
      .catch(() => {
        throw new BadRequestException('Not following this user');
      });

    return { success: true };
  }

  async removeFollower(currentUserId: string, followerUsername: string) {
    const currentUserProfile = await this.getProfileByUserId(currentUserId);
    const followerProfile = await this.prisma.profile.findUnique({
      where: { username: followerUsername },
    });

    if (!followerProfile)
      throw new NotFoundException('Follower profile not found');

    await this.prisma.profiles_Follows
      .delete({
        where: {
          follower_profile_id_followed_profile_id: {
            follower_profile_id: followerProfile.id,
            followed_profile_id: currentUserProfile.id,
          },
        },
      })
      .catch(() => {
        throw new BadRequestException('User is not following you');
      });

    return { success: true };
  }

  async handleFollowRequest(
    userId: string,
    followerId: string,
    approve: boolean,
  ) {
    const profile = await this.getProfileByUserId(userId);

    if (approve) {
      await this.prisma.profiles_Follows.update({
        where: {
          follower_profile_id_followed_profile_id: {
            follower_profile_id: followerId,
            followed_profile_id: profile.id,
          },
        },
        data: { accepted: true, updated_by: userId },
      });
      return { status: 'approved' };
    } else {
      await this.prisma.profiles_Follows.delete({
        where: {
          follower_profile_id_followed_profile_id: {
            follower_profile_id: followerId,
            followed_profile_id: profile.id,
          },
        },
      });
      return { status: 'rejected' };
    }
  }

  async getFollowers(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    return this.prisma.profiles_Follows.findMany({
      where: { followed_profile_id: profile.id, accepted: true },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async getFollowing(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    return this.prisma.profiles_Follows.findMany({
      where: { follower_profile_id: profile.id, accepted: true },
      include: {
        followed: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async getFollowRequests(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    return this.prisma.profiles_Follows.findMany({
      where: { followed_profile_id: profile.id, accepted: false },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async getSentRequests(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    return this.prisma.profiles_Follows.findMany({
      where: { follower_profile_id: profile.id, accepted: false },
      include: {
        followed: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
}
