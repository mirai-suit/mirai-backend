import { loginSchema } from './../interfaces/schemas/create/auth/index';
import { validateData, verifyToken } from './../middlewares/auth.middleware';
import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { signUpSchema } from 'src/interfaces/schemas/create/auth';

const router = Router();

// Public routes - no authentication required
router.post('/signup', validateData(signUpSchema), authController.signup);
router.post('/login', validateData(loginSchema), authController.login);
router.post('/refresh-token', authController.refreshToken);

// Protected routes - authentication required
router.post('/logout', verifyToken, authController.logout);
router.get('/me', verifyToken, authController.getCurrentUser);

export default router;