import { loginSchema, passwordResetRequestSchema, passwordResetSchema, verificationCodeSchema } from './../interfaces/schemas/create/auth/index';
import { validateData, verifyToken } from './../middlewares/auth.middleware';
import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { userSchema } from 'src/interfaces/schemas/create/auth';

const router = Router();

// Public routes - no authentication required
router.post('/signup',validateData(userSchema), authController.signup);
router.post('/login', validateData(loginSchema),authController.login);
router.post('/verify-otp',verifyToken,validateData(verificationCodeSchema), authController.verifyOtp);
router.get('/resend-otp', verifyToken,authController.resendOtp);
router.post('/refresh-token', authController.refreshToken);
router.post('/reset-password/request-otp', validateData(passwordResetRequestSchema), authController.requestPasswordReset);
router.post('/reset-password/verify-otp', validateData(verificationCodeSchema), authController.verifyPasswordResetOtp);
router.post('/reset-password/reset', validateData(passwordResetSchema), authController.resetPassword);

// Protected routes - authentication required
router.get('/me', verifyToken, authController.getCurrentUser);

export default router;