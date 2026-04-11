import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const schema = process.env.DATABASE_SCHEMA || "public";

const adapter = new PrismaPg({ connectionString }, { schema });

const prisma = new PrismaClient({ adapter });

export { prisma };
