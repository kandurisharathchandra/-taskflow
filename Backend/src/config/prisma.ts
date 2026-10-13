import { PrismaClient } from '@prisma/client';

// Query errors are not logged here: expected ones (e.g. a missing task) become 4xx responses,
// and unexpected ones are logged once by the error handler.
export const prisma = new PrismaClient({ log: ['warn'] });
