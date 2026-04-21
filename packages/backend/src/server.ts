import "./env"; // must be first — loads .env before any module reads process.env
import { createApp } from "./index";
import { logger } from "./logger";

const PORT = Number(process.env.SERVER_PORT ?? 3001);
const app = createApp();

app.listen(PORT, () => {
  logger.info(`Marketing OS server running on http://localhost:${PORT}`);
  logger.info("Routes: POST /api/run-agent | GET /api/kb-status | GET /api/outputs | GET /api/health");
});
