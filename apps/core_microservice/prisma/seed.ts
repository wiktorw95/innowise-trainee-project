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
  console.log('--- Start testu PR 2.2 (Driver Adapter Mode) ---');

  try {
    // 1. Relacja 1:1 (Auth -> Main)
    const newUser = await prisma.user.create({
      data: {
        email: `dev_${Date.now()}@innowise.com`,
        password: 'hash_password',
        profile: {
          create: { username: `dev_user_${Math.floor(Math.random() * 1000)}` },
        },
      },
      include: { profile: true },
    });
    console.log('✅ User (auth) i Profile (main) utworzone');

    // 2. Asset
    const asset = await prisma.asset.create({
      data: { url: 'https://cdn.com/img.jpg', type: 'IMAGE' },
    });

    // 3. Many-to-Many (Post -> PostAsset -> Asset)
    const post = await prisma.post.create({
      data: {
        content: 'Test relacji many-to-many',
        authorId: newUser.profile!.id,
        assets: {
          create: [{ assetId: asset.id }],
        },
      },
    });
    console.log('✅ Relacja Many-to-Many (Post-Asset) działa');

    await prisma.notification.create({
      data: {
        targetId: newUser.profile!.id,
        type: 'SYSTEM',
        content: 'Weryfikacja zakończona',
      },
    });
    console.log('✅ Schemat notification działa');
  } catch (e) {
    console.error('❌ Test nieudany. Sprawdź czy tablice istnieją:', e);
  }
}

await testDatabase().finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
