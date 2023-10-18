import { PrismaClient } from "@prisma/client";
import { BSON } from "bson";

const prisma = new PrismaClient();
prisma.$connect().then(() => console.log("Connected to database"));

export default prisma;
