import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function resolveDatabaseUrl(): string | undefined {
  // On Vercel Serverless Functions, /var/task is read-only; copy pre-seeded SQLite DB to /tmp/dev.db
  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/dev.db';
    try {
      if (!fs.existsSync(tmpDbPath)) {
        const candidates = [
          path.join(process.cwd(), 'prisma', 'dev.db'),
          path.join(process.cwd(), 'dev.db'),
        ];
        const sourceDb = candidates.find((p) => fs.existsSync(p));
        if (sourceDb) {
          fs.copyFileSync(sourceDb, tmpDbPath);
        }
      }
      if (fs.existsSync(tmpDbPath)) {
        return `file:${tmpDbPath}`;
      }
    } catch {
      // Fallback to schema.prisma default file:./dev.db
    }
  }
  return undefined;
}

const runtimeUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    ...(runtimeUrl ? { datasources: { db: { url: runtimeUrl } } } : {}),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
