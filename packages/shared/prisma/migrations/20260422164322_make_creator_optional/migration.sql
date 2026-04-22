-- DropForeignKey
ALTER TABLE "auth"."Account" DROP CONSTRAINT "Account_created_by_fkey";

-- DropForeignKey
ALTER TABLE "main"."Profile" DROP CONSTRAINT "Profile_created_by_fkey";

-- AlterTable
ALTER TABLE "auth"."Account" ALTER COLUMN "created_by" DROP NOT NULL;

-- AlterTable
ALTER TABLE "main"."Profile" ALTER COLUMN "created_by" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "auth"."Account" ADD CONSTRAINT "Account_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main"."Profile" ADD CONSTRAINT "Profile_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
