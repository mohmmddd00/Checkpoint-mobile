import session from "express-session";

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "checkpoint-session-secret",
  resave: false,
  saveUninitialized: false,
});