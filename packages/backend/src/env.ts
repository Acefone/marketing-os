// Loads .env from project root before any other module reads process.env.
// This file must be the first import in server.ts.
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
