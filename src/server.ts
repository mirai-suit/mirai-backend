import express, { Request, Response } from 'express';
import cors from 'cors';
import env from './config/env';
import logger from './utils/logger';
import routes from './routes';
import errorHandler from './middlewares/error.middleware';
import prisma from './config/prisma/prisma.client';
import { allowedOrigins } from './config/origins/allowed.origins';
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';

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

// Create HTTP server
const ioServer = http.createServer(app);

// Initialize Socket.IO server
const io = new SocketIOServer(ioServer, {
  cors: {
    origin: '*', // Adjust as needed for security
    methods: ['GET', 'POST'],
  },
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Example: join a board room
  socket.on('joinBoard', (boardId) => {
    socket.join(`board_${boardId}`);
    console.log(`User ${socket.id} joined board ${boardId}`);
  });

  // Example: leave a board room
  socket.on('leaveBoard', (boardId) => {
    socket.leave(`board_${boardId}`);
    console.log(`User ${socket.id} left board ${boardId}`);
  });

  // Example: handle sending a message
  socket.on('sendMessage', (data) => {
    // Broadcast to all users in the board room
    io.to(`board_${data.boardId}`).emit('receiveMessage', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});



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
const server = ioServer.listen(PORT, () => {
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
export { io , ioServer }; // Export the Socket.IO instance for use in other modules
