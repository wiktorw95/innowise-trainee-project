import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  UseGuards,
  Delete,
  Patch,
  Body,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service.js';
import { AccessGuard } from '../auth/access.guard.js';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('Profiles & Following')
@ApiBearerAuth()
@UseGuards(AccessGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me/followers')
  getFollowers(@Req() req: RequestWithUser) {
    return this.profilesService.getFollowers(req.user.id);
  }

  @Get('me/following')
  getFollowing(@Req() req: RequestWithUser) {
    return this.profilesService.getFollowing(req.user.id);
  }

  @Get('me/requests')
  getRequests(@Req() req: RequestWithUser) {
    return this.profilesService.getFollowRequests(req.user.id);
  }

  @Get('me/requests/sent')
  getSentRequests(@Req() req: RequestWithUser) {
    return this.profilesService.getSentRequests(req.user.id);
  }

  @Post(':username/follow')
  follow(@Req() req: RequestWithUser, @Param('username') username: string) {
    return this.profilesService.followUser(req.user.id, username);
  }

  @Delete(':username/unfollow')
  unfollow(@Req() req: RequestWithUser, @Param('username') username: string) {
    return this.profilesService.unfollowUser(req.user.id, username);
  }

  @Delete('followers/:username')
  removeFollower(
    @Req() req: RequestWithUser,
    @Param('username') username: string,
  ) {
    return this.profilesService.removeFollower(req.user.id, username);
  }

  @Patch('followers/:followerId/approve')
  handleRequest(
    @Req() req: RequestWithUser,
    @Param('followerId') followerId: string,
    @Body('approve') approve: boolean,
  ) {
    return this.profilesService.handleFollowRequest(
      req.user.id,
      followerId,
      approve,
    );
  }
}
