import { PrismaClient } from '../generated/prisma/client/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function testDatabase() {
  console.log('Running database...');

  try {
    const newUser = await prisma.user.create({
      data: {
        email: `user_${Date.now()}@innowise.com`,
        password: `hashed_password`,
        profile: {
          create: { username: `dev_user_${Date.now()}` },
        },
      },
      include: { profile: true },
    });
    console.log('User and Profile created!');
    console.log('User: ', newUser);

    const asset = await prisma.asset.create({
      data: { url: 'https://cdn.com/img.jpg', type: 'image/png' },
    });

    console.log('Asset: ', asset);

    await prisma.notification.create({
      data: {
        targetId: newUser.profile!.id,
        type: 'SYSTEM',
        content: 'Finalized verification',
      },
    });
    console.log('Successfully created notification!');
  } catch (err) {
    console.error('Error! Check if tables exist: ', err);
  }
}

await testDatabase().finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
