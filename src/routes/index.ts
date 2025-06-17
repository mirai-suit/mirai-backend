import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes'; 
import organizationRoutes from './organization.routes'; 

const router = Router();

// Health check for API routes
router.get('/', (_req, res) => {
  res.status(200).json({ message: 'API is running' });
});

// Register all route modules
router.use('/auth', authRoutes);
router.use('/user', userRoutes); // Assuming user routes are also in auth.routes.ts
router.use('/organization', organizationRoutes);

export default router;