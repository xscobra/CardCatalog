import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db, sql } from "./db";

console.log("[SERVER LOG] [1/7] Starting server/index.ts...");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add error logging middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[SERVER LOG] Uncaught Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// Test database connection before starting the server
(async () => {
  try {
    console.log("[SERVER LOG] [2/7] Entering async startup block...");
    // Test the database connection
    await db.execute(sql`SELECT 1`);
    console.log('[SERVER LOG] [3/7] Database connection successful.');

    console.log('[SERVER LOG] [4/7] Registering routes...');
    const server = await registerRoutes(app);
    console.log('[SERVER LOG] [5/7] Routes registered successfully.');

    // Configure for production vs development
    const isProduction = process.env.NODE_ENV === "production";
    const PORT = Number(process.env.PORT) || 5000;

    if (isProduction) {
      serveStatic(app);
      console.log('[SERVER LOG] [6/7] Production mode configured. Serving static files.');
    } else {
      await setupVite(app, server);
      console.log('[SERVER LOG] [6/7] Development mode configured. Using Vite.');
    }

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`[SERVER LOG] [7/7] SERVER IS LIVE AND LISTENING ON PORT ${PORT}`);
      const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      console.log(`${formattedTime} [express] Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database URL configured: ${!!process.env.DATABASE_URL}`);
    });
  } catch (error) {
    console.error('[SERVER LOG] [CRITICAL FAILURE] Failed to start server inside async block:', error);
    process.exit(1);
  }
})();
