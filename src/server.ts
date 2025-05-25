import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import env from './config/env';
import logger from './utils/logger';
import routes from './routes';
import errorHandler from './middlewares/error.middleware';
import prisma from './config/prisma/prisma.client';
import { allowedOrigins } from './config/origins/allowed.origins';


// Initialize Express application
const app = express();
if(!env) {
  logger.error("Environment variables are not loaded");
  process.exit(1);
};
// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (process.env.NODE_ENV === "DEVELOPMENT" || process.env.NODE_ENV === "LOCAL") {
      return callback(null, true);
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS Denied for: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

// Middleware setup
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date(), 
    message: 'Mfs server' 
  });
});

// API routes
app.use('/api', routes);

// Error handler middleware
app.use(errorHandler);

// Server initialization
const PORT = env.PORT;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
  logger.info(`Connecting to database...`);
});

// Graceful shutdown handling
const gracefulShutdown = async () => {
  logger.info('Shutting down server...');
  
  server.close(async () => {
    logger.info('Express server closed');
    await prisma.$disconnect();
    logger.info('Database connection closed');
    process.exit(0);
  });
};

// Event listeners for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;
