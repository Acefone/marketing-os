import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db/client";
import { authenticate, requireRole } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET ?? "change-me-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "8h";

// POST /api/auth/login
router.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const { rows } = await db.query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.is_active, r.name AS role
     FROM users u JOIN roles r ON u.role_id = r.id
     WHERE u.email = $1`,
    [email.toLowerCase()]
  );

  const user = rows[0];
  if (!user || !user.is_active) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  await db.query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [user.id]);

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role as UserRole },
    JWT_SECRET,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { expiresIn: JWT_EXPIRES_IN as any }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// GET /api/auth/me
router.get("/auth/me", authenticate, (req: Request, res: Response) => {
  res.json(req.user);
});

// POST /api/auth/users — admin only: create a new user
router.post("/auth/users", authenticate, requireRole("admin"), async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
  };

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "name, email, password, and role are required" });
  }

  const validRoles: UserRole[] = ["admin", "editor", "viewer"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${validRoles.join(", ")}` });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const { rows } = await db.query(
    `INSERT INTO users (name, email, password_hash, role_id)
     SELECT $1, $2, $3, r.id FROM roles r WHERE r.name = $4
     RETURNING id, name, email`,
    [name, email.toLowerCase(), passwordHash, role]
  );

  res.status(201).json(rows[0]);
});

// GET /api/auth/users — admin only
router.get("/auth/users", authenticate, requireRole("admin"), async (_req: Request, res: Response) => {
  const { rows } = await db.query(
    `SELECT u.id, u.name, u.email, r.name AS role, u.is_active, u.last_login_at, u.created_at
     FROM users u JOIN roles r ON u.role_id = r.id
     ORDER BY u.created_at DESC`
  );
  res.json(rows);
});

// PATCH /api/auth/users/:id — admin only: update role or deactivate
router.patch("/auth/users/:id", authenticate, requireRole("admin"), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, isActive } = req.body as { role?: UserRole; isActive?: boolean };

  if (role) {
    await db.query(
      "UPDATE users SET role_id = (SELECT id FROM roles WHERE name = $1), updated_at = NOW() WHERE id = $2",
      [role, id]
    );
  }

  if (isActive !== undefined) {
    await db.query("UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2", [isActive, id]);
  }

  res.json({ updated: true });
});

export default router;
