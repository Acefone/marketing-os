import { Router, Request, Response } from "express";
import { getKBStatus } from "../services/kb-parser.service";

const router = Router();

router.get("/kb-status", (_req: Request, res: Response) => {
  const statuses = getKBStatus();
  res.json(statuses);
});

export default router;
