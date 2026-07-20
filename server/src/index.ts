import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { getDb } from "./db.js";
import { registerRoutes } from "./routes/index.js";

async function main() {
  getDb();
  const app = Fastify({ logger: true });
  await app.register(cors, {
    origin: config.corsOrigins.length ? config.corsOrigins : true,
  });
  await registerRoutes(app);
  await app.listen({ port: config.port, host: "0.0.0.0" });
  console.log(`API http://localhost:${config.port}/api/health`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
