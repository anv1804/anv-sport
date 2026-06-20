import { PrismaClient } from '@prisma/client';
import { initClonerScheduler } from "./clonerScheduler";

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Limit connection pool to prevent EMAXCONN in dev/serverless environments
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

// Initialize Background Auto Cloner Scheduler
try {
  initClonerScheduler();
} catch (error) {
  console.error("[Scheduler Init Error]:", error);
}

export default prisma;
