-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "main";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "notification";

-- CreateTable
CREATE TABLE "auth"."User" (
    "id" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'User',
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(36),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(36),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(20) NOT NULL DEFAULT 'local',
    "provider_id" TEXT NOT NULL,
    "last_login_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(36) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(36),

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "main"."Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "displayName" VARCHAR(100) NOT NULL,
    "birthday" DATE NOT NULL,
    "bio" TEXT,
    "avatarUrl" VARCHAR(500),
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(36) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(36),
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "main"."Post" (
    "id" TEXT NOT NULL,
    "profileId" VARCHAR(36) NOT NULL,
    "content" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(36) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(36),

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "main"."Comment" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "parent_comment_id" TEXT,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(36) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(36),

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "main"."Asset" (
    "id" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_type" VARCHAR(100) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(36) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(36),

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "main"."Chat" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL DEFAULT 'private',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(36) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(36),

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "main"."Message" (
    "id" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "reply_to_message_id" TEXT,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(36) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(36),
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "main"."Profile_Configuration" (
    "id" TEXT NOT NULL,
    "config_key" VARCHAR(100) NOT NULL,
    "is_admin_accessible_only" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(36) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(36),

    CONSTRAINT "Profile_Configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification"."Notification" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(36) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(36),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "main"."Posts_Assets" (
    "post_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(36) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(36),

    CONSTRAINT "Posts_Assets_pkey" PRIMARY KEY ("post_id","asset_id")
);

-- CreateTable
CREATE TABLE "main"."Profiles_Follows" (
    "follower_profile_id" TEXT NOT NULL,
    "followed_profile_id" TEXT NOT NULL,
    "accepted" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(36) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(36),

    CONSTRAINT "Profiles_Follows_pkey" PRIMARY KEY ("follower_profile_id","followed_profile_id")
);

-- CreateTable
CREATE TABLE "main"."Chat_Participants" (
    "profile_id" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(36) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(36),

    CONSTRAINT "Chat_Participants_pkey" PRIMARY KEY ("profile_id","chat_id")
);

-- CreateTable
CREATE TABLE "main"."Messages_Assets" (
    "message_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(36) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(36),

    CONSTRAINT "Messages_Assets_pkey" PRIMARY KEY ("message_id","asset_id")
);

-- CreateTable
CREATE TABLE "main"."Posts_Likes" (
    "post_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(36) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(36),

    CONSTRAINT "Posts_Likes_pkey" PRIMARY KEY ("post_id","profile_id")
);

-- CreateTable
CREATE TABLE "main"."Comments_Likes" (
    "comment_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(36) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(36),

    CONSTRAINT "Comments_Likes_pkey" PRIMARY KEY ("comment_id","profile_id")
);

-- CreateTable
CREATE TABLE "main"."Profiles_to_Profiles" (
    "profile_id" TEXT NOT NULL,
    "profile_configuration_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(36) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(36),

    CONSTRAINT "Profiles_to_Profiles_pkey" PRIMARY KEY ("profile_id","profile_configuration_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "auth"."Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "main"."Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_username_key" ON "main"."Profile"("username");

-- AddForeignKey
ALTER TABLE "auth"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Account" ADD CONSTRAINT "Account_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Account" ADD CONSTRAINT "Account_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Profile" ADD CONSTRAINT "Profile_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Profile" ADD CONSTRAINT "Profile_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Post" ADD CONSTRAINT "Post_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "main"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Post" ADD CONSTRAINT "Post_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Post" ADD CONSTRAINT "Post_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Comment" ADD CONSTRAINT "Comment_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "main"."Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Comment" ADD CONSTRAINT "Comment_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "main"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Comment" ADD CONSTRAINT "Comment_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "main"."Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Comment" ADD CONSTRAINT "Comment_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Comment" ADD CONSTRAINT "Comment_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Asset" ADD CONSTRAINT "Asset_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Asset" ADD CONSTRAINT "Asset_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Chat" ADD CONSTRAINT "Chat_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Chat" ADD CONSTRAINT "Chat_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Message" ADD CONSTRAINT "Message_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "main"."Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Message" ADD CONSTRAINT "Message_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "main"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Message" ADD CONSTRAINT "Message_reply_to_message_id_fkey" FOREIGN KEY ("reply_to_message_id") REFERENCES "main"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Message" ADD CONSTRAINT "Message_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Message" ADD CONSTRAINT "Message_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Profile_Configuration" ADD CONSTRAINT "Profile_Configuration_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Profile_Configuration" ADD CONSTRAINT "Profile_Configuration_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification"."Notification" ADD CONSTRAINT "Notification_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification"."Notification" ADD CONSTRAINT "Notification_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Posts_Assets" ADD CONSTRAINT "Posts_Assets_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "main"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Posts_Assets" ADD CONSTRAINT "Posts_Assets_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "main"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Posts_Assets" ADD CONSTRAINT "Posts_Assets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Posts_Assets" ADD CONSTRAINT "Posts_Assets_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Profiles_Follows" ADD CONSTRAINT "Profiles_Follows_follower_profile_id_fkey" FOREIGN KEY ("follower_profile_id") REFERENCES "main"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Profiles_Follows" ADD CONSTRAINT "Profiles_Follows_followed_profile_id_fkey" FOREIGN KEY ("followed_profile_id") REFERENCES "main"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Profiles_Follows" ADD CONSTRAINT "Profiles_Follows_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Profiles_Follows" ADD CONSTRAINT "Profiles_Follows_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Chat_Participants" ADD CONSTRAINT "Chat_Participants_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "main"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Chat_Participants" ADD CONSTRAINT "Chat_Participants_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "main"."Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Chat_Participants" ADD CONSTRAINT "Chat_Participants_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Chat_Participants" ADD CONSTRAINT "Chat_Participants_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Messages_Assets" ADD CONSTRAINT "Messages_Assets_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "main"."Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Messages_Assets" ADD CONSTRAINT "Messages_Assets_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "main"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Messages_Assets" ADD CONSTRAINT "Messages_Assets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Messages_Assets" ADD CONSTRAINT "Messages_Assets_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Posts_Likes" ADD CONSTRAINT "Posts_Likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "main"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Posts_Likes" ADD CONSTRAINT "Posts_Likes_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "main"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Posts_Likes" ADD CONSTRAINT "Posts_Likes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Posts_Likes" ADD CONSTRAINT "Posts_Likes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Comments_Likes" ADD CONSTRAINT "Comments_Likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "main"."Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Comments_Likes" ADD CONSTRAINT "Comments_Likes_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "main"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Comments_Likes" ADD CONSTRAINT "Comments_Likes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Comments_Likes" ADD CONSTRAINT "Comments_Likes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Profiles_to_Profiles" ADD CONSTRAINT "Profiles_to_Profiles_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "main"."Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Profiles_to_Profiles" ADD CONSTRAINT "Profiles_to_Profiles_profile_configuration_id_fkey" FOREIGN KEY ("profile_configuration_id") REFERENCES "main"."Profile_Configuration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Profiles_to_Profiles" ADD CONSTRAINT "Profiles_to_Profiles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Profiles_to_Profiles" ADD CONSTRAINT "Profiles_to_Profiles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
