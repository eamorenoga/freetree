const { requireEnvironment } = require("../config/env");
const { PrismaClient } = require("@prisma/client");

requireEnvironment();

const prisma = new PrismaClient();

module.exports = prisma;
