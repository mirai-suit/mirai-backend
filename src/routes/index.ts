import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes'; 

const router = Router();

// Health check for API routes
router.get('/', (_req, res) => {
  res.status(200).json({ message: 'API is running' });
});

// Register all route modules
router.use('/auth', authRoutes);
router.use('/user', userRoutes); // Assuming user routes are also in auth.routes.ts


export default router;