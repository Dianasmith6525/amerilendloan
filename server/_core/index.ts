import "dotenv/config";
import express from "express";
import { createServer as createHttpServer } from "http";
import { createServer as createHttpsServer } from "https";
import fs from "fs";
import path from "path";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleAuthorizeNetWebhook, handleCryptoWebhook } from "./webhooks";
import { apiLimiter, authLimiter, otpLimiter, paymentLimiter, loanApplicationLimiter } from "./rateLimiter";
import { startPaymentMonitoring } from "./payment-monitor";

console.log('[Startup] Starting server initialization...');

// Catch unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught Exception:', error);
  process.exit(1);
});

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  try {
    console.log('[Server] Creating Express app...');
    const app = express();
    console.log('[Server] Express app created successfully');
    
    // Create HTTPS server for development, HTTP for production
    let server;
    console.log('[Server] NODE_ENV =', process.env.NODE_ENV);
    if (process.env.NODE_ENV === "development") {
      try {
        const certPath = path.join(process.cwd(), "certs", "cert.pem");
        const keyPath = path.join(process.cwd(), "certs", "key.pem");
        
        if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
          const httpsOptions = {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
          };
          server = createHttpsServer(httpsOptions, app);
          console.log('[Server] Using HTTPS server for development');
        } else {
          console.warn('[Server] SSL certificates not found, falling back to HTTP');
          console.warn('[Server] Run "node generate-ssl-certs.mjs" to generate certificates');
          server = createHttpServer(app);
        }
      } catch (e) {
        console.error('[Server] Error setting up HTTPS:', e);
        server = createHttpServer(app);
      }
    } else {
      console.log('[Server] Production mode - using HTTP');
      server = createHttpServer(app);
    }
    
    console.log('[Server] Configuring middleware...');
    // Configure body parser with larger size limit for file uploads
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true }));
    console.log('[Server] Body parser configured');

    // Rate limiting middleware
    try {
      app.use("/api/trpc/auth.", authLimiter); // Authentication endpoints
      app.use("/api/trpc/otp.", otpLimiter); // OTP endpoints
      app.use("/api/trpc/payments.", paymentLimiter); // Payment endpoints
      app.use("/api/trpc/loans.submit", loanApplicationLimiter); // Loan application endpoint
      app.use("/api/trpc", apiLimiter); // General API rate limiting
      console.log('[Server] Rate limiters configured');
    } catch (e) {
      console.error('[Server] Error configuring rate limiters:', e);
      throw e;
    }

    // Payment Webhooks
    console.log('[Server] Setting up webhooks...');
    app.post("/api/webhooks/authorizenet", handleAuthorizeNetWebhook);
    app.post("/api/webhooks/coinbase", handleCryptoWebhook);
    app.post("/api/webhooks/crypto", handleCryptoWebhook);
    console.log('[Server] Webhooks configured');
    
    // OAuth callback under /api/oauth/callback
    console.log('[Server] Registering OAuth routes...');
    registerOAuthRoutes(app);
    console.log('[Server] OAuth routes registered');
    
    // tRPC API
    console.log('[Server] Setting up tRPC...');
    try {
      app.use(
        "/api/trpc",
        createExpressMiddleware({
          router: appRouter,
          createContext,
        })
      );
      console.log('[Server] tRPC configured');
    } catch (e) {
      console.error('[Server] Error configuring tRPC:', e);
      throw e;
    }
    
    // development mode uses Vite, production mode uses static files
    try {
      if (process.env.NODE_ENV === "development") {
        console.log('[Server] Setting up Vite...');
        await setupVite(app, server);
        console.log('[Server] Vite setup complete');
      } else {
        serveStatic(app);
      }
    } catch (viteError) {
      console.error('[Server] Vite setup error:', viteError);
      throw viteError;
    }

    // Error handling middleware - must be after all other middleware
    app.use((err: any, req: any, res: any, next: any) => {
      console.error('[Express Error]', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    const preferredPort = parseInt(process.env.PORT || "3000");
    const port = await findAvailablePort(preferredPort);

    if (port !== preferredPort) {
      console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
    }

    console.log(`[Server] Attempting to listen on port ${port}...`);
    
    // Wait for server to actually start listening
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Server failed to listen on port ${port} within 10 seconds`));
      }, 10000);
      
      server.listen(port, "0.0.0.0", () => {
        clearTimeout(timeout);
        const protocol = process.env.NODE_ENV === "development" && fs.existsSync(path.join(process.cwd(), "certs", "cert.pem")) ? "https" : "http";
        console.log(`[Server] Successfully listening on ${protocol}://localhost:${port}/`);
        console.log('[Server] Vite dev server ready');
        resolve();
      });
      
      server.on('error', (err) => {
        clearTimeout(timeout);
        console.error('[Server] Listen error:', err);
        reject(err);
      });
    });

    console.log('[Server] Server fully initialized, keeping process alive...');
    
    // Start crypto payment monitoring service (disabled temporarily due to database connection issue)
    // startPaymentMonitoring();
    
    console.log(`[Server] ✅ Server ready at ${process.env.NODE_ENV === "development" ? "https" : "http"}://localhost:${port}`);
    console.log('[Server] Server is now running. Press Ctrl+C to stop.');
    
    // Return a never-resolving promise to keep the process alive
    // The server.listen() has already bound to the port and will keep the event loop running
    return new Promise<void>(() => {
      // This intentionally never resolves
      // Process will continue running indefinitely
    });
    
  } catch (error) {
    console.error('[FATAL] Server startup error:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

// Start the server - startServer() returns a never-resolving promise that keeps process alive
const serverPromise = startServer();
console.log('[Main] startServer() called, returned promise');

serverPromise.then(() => {
  console.log('[Main] Promise resolved (should never happen)');
}).catch(error => {
  console.error('[Main] Promise rejected:', error);
  console.error('[Main] Error details:', error?.message, error?.stack);
  process.exit(1);
});

console.log('[Main] Error handlers attached');

// CRITICAL: Keep process alive by resuming stdin and setting an interval
// The server.listen() alone doesn't keep the process alive in some environments
process.stdin.resume();
console.log('[Main] stdin resumed');

// Keep the process active by creating an interval that is NOT unref'd
setInterval(() => {
  // Keep event loop alive
}, 30000);

console.log('[Main] Main execution complete, waiting for server promise...');

// Ensure we handle any uncaught rejections  
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught Exception:', error);
  process.exit(1);
});
