import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

async function main() {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error('Could not connect to the database. Check DATABASE_URL and that PostgreSQL is running.');
    console.error(error);
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`TaskFlow API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = () => {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

void main();
