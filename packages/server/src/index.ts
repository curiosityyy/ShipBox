import Fastify from "fastify";
import cors from "@fastify/cors";
import { dashboardRoutes } from "./routes/dashboard.js";
import { repoRoutes } from "./routes/repos.js";
import { settingsRoutes } from "./routes/settings.js";
import { sessionRoutes } from "./routes/sessions.js";
import { configRoutes } from "./routes/config.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

// Register routes
await app.register(dashboardRoutes);
await app.register(repoRoutes);
await app.register(settingsRoutes);
await app.register(sessionRoutes);
await app.register(configRoutes);

// Import DB to initialize
import "./db/index.js";

const port = parseInt(process.env.PORT || "3141");
try {
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`ShipBox server running on http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
