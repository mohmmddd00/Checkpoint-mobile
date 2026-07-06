import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { connectDB } from "./config/db.js";
import { sessionMiddleware } from "./config/sessionConfig.js";
import passport from "./config/passportConfig.js";
import gameLogRoutes from "./routes/gameLogRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import vaultRoutes from "./routes//vaultRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import savedVaultRoutes from "./routes/savedVaultRoutes.js";
import upcomingRoutes from "./routes/upcomingRoutes.js";
import hofRoutes from "./routes/hofRoutes.js";

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "https://checkpoint-blue.vercel.app"],
  credentials: true,
}));
app.use(express.json());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/gamelogs", gameLogRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/vaults", vaultRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/saved-vaults", savedVaultRoutes);
app.use("/api/upcoming-games", upcomingRoutes);
app.use("/api/hall-of-fame", hofRoutes);

app.get("/", (_req, res) => {
  res.send("Checkpoint API running");
});

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.on("error", (error) => {
      console.error("Server listen error:", error);
    });
  } catch (error) {
    console.error("Server failed to start:", error);
    process.exit(1);
  }
}

startServer();