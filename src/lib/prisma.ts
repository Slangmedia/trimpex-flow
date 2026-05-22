import "./error-interceptor";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let datasourceUrl = process.env.DATABASE_URL;
if (datasourceUrl && !datasourceUrl.includes("connection_limit")) {
  const separator = datasourceUrl.includes("?") ? "&" : "?";
  datasourceUrl = `${datasourceUrl}${separator}connection_limit=5&pool_timeout=30`;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? [] : ["query"],
    datasourceUrl,
  });

globalForPrisma.prisma = prisma;
