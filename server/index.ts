import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db, sql } from "./db";

// Error logging utilities
interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  path?: string;
  method?: string;
  statusCode?: number;
  stack?: string;
  context?: Record<string, any>;
}

function logError(error: ErrorLog) {
  const logEntry = {
    ...error,
    timestamp: error.timestamp || new Date().toISOString(),
  };

  // Log to console with proper formatting
  const logColor = error.level === 'error' ? '\x1b[31m' : // red
                   error.level === 'warn' ? '\x1b[33m' : // yellow
                   '\x1b[36m'; // cyan for info

  console.log(`${logColor}[${logEntry.timestamp}] ${error.level.toUpperCase()}: ${error.message}\x1b[0m`);
  if (error.path) console.log(`  Path: ${error.path}`);
  if (error.method) console.log(`  Method: ${error.method}`);
  if (error.statusCode) console.log(`  Status: ${error.statusCode}`);
  if (error.context) console.log(`  Context:`, error.context);
  if (error.stack) console.log(`  Stack:\n${error.stack}`);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
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
      const level = res.statusCode >= 400 ? 'error' : 'info';
      logError({
        level,
        message: `${req.method} ${path} ${res.statusCode} in ${duration}ms`,
        path,
        method: req.method,
        statusCode: res.statusCode,
        context: capturedJsonResponse,
        timestamp: new Date().toISOString()
      });
    }
  });

  next();
});

// Enhanced error handling middleware
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const errorContext = {
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body,
    headers: req.headers,
  };

  logError({
    level: 'error',
    message: err.message || 'Internal server error',
    path: req.path,
    method: req.method,
    statusCode: err.status || 500,
    stack: err.stack,
    context: errorContext,
    timestamp: new Date().toISOString()
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    requestId: new Date().getTime().toString(),
  });
});

// Test database connection before starting the server
(async () => {
  try {
    // Test the database connection
    await db.execute(sql`SELECT 1`);
    logError({
      level: 'info',
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });

    const server = await registerRoutes(app);

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const PORT = 5000;
    server.listen(PORT, "0.0.0.0", () => {
      logError({
        level: 'info',
        message: `Server running on port ${PORT}`,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error: any) {
    logError({
      level: 'error',
      message: 'Failed to start server',
      stack: error.stack,
      context: { error: error.message },
      timestamp: new Date().toISOString()
    });
    process.exit(1);
  }
})();