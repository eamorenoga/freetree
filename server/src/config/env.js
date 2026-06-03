const path = require("path");
const dotenv = require("dotenv");

const rootEnvPath = path.resolve(__dirname, "..", "..", "..", ".env");

dotenv.config({ path: rootEnvPath });
dotenv.config();

function requireEnvironment() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no esta configurada. Crea .env desde .env.example o configura DATABASE_URL en Render.");
  }
}

module.exports = { requireEnvironment, rootEnvPath };
