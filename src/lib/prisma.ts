import "dotenv/config";
import { PrismaClient } from "@generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;
const schema = process.env.DATABASE_SCHEMA || "public";

const adapter = new PrismaPg({ connectionString }, { schema });

const prisma = new PrismaClient({ adapter });

export { prisma };
