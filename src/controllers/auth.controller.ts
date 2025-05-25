import {  PasswordResetInput, requestResetPasswordInput, VerificationCodeInput } from './../interfaces/DTOs/auth/index';
import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';
import * as authService from '../services/auth.service';
import { LoginInput, UserInput } from '../interfaces/DTOs/auth';
import { otpPurpose } from 'src/interfaces/enums/auth';
import CustomError from 'src/shared/exceptions/CustomError';
import jwt from 'jsonwebtoken';

/**
 * Register a new user
 * @route POST /api/auth/signup
 */
export const signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate request body
        const userData: UserInput = req.body;

        // Use auth service to create user
        const result = await authService.signUp(userData);

        // Return successful response
        res.status(201).json({
            success: true,
            message: 'User registered successfully. Check your email for verification code.',
            data: result
        });
    } catch (error) {
        logger.error(`Signup error: ${error}`);
        next(error);
    }
};

/**
 * Verify OTP code sent to user
 * @route POST /api/auth/verify-otp
 */
export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {code} = req.body as VerificationCodeInput;
        const userId = req.user.id;
        const result = await authService.verifyOtp(userId, code , otpPurpose.email_verification);

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            isVerified: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * User login
 * @route POST /api/auth/login
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate request body
        const loginData: LoginInput = req.body;

        // Use auth service to login
        const result = await authService.login(loginData);

        // Return successful response
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: result
        });
    } catch (error) {
        logger.error(`Login error: ${error}`);
        next(error);
    }
};

/**
 * Refresh access token using refresh token
 * @route POST /api/auth/refresh-token
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
            return;
        }

        const result = await authService.renewTokens(refreshToken);

        res.status(200).json({
            success: true,
            message: 'Tokens refreshed successfully',
            data: result
        });
    } catch (error) {
        logger.error(`Token refresh error: ${error}`);
        next(error);
    }
};

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
            return;
        }

        const user = await authService.findUserById(userId);

        // Remove sensitive information
        const { password, ...userWithoutPassword } = user;

        res.status(200).json({
            success: true,
            data: userWithoutPassword
        });
    } catch (error) {
        logger.error(`Get user profile error: ${error}`);
        next(error);
    }
};

/**
 * Resend OTP to user's email
 * @route POST /api/auth/resend-otp
 */
export const resendOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.id;
        await authService.resendOtp(userId);

        res.status(200).json({
            success: true,
            message: 'A new verification code has been sent to your email'
        });
    } catch (error) {
        logger.error(`Resend OTP error: ${error}`);
        next(error);
    }
};

/**
 * Logout user and invalidate tokens
 * @route POST /api/auth/logout
 */
// export const logout = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { refreshToken } = req.body;
        
//         if (!refreshToken) {
//             res.status(400).json({
//                 success: false,
//                 message: 'Refresh token is required'
//             });
//             return;
//         }

//         // You need to implement this function in your auth service
//         // await authService.invalidateRefreshToken(refreshToken);

//         res.status(200).json({
//             success: true,
//             message: 'Logged out successfully'
//         });
//     } catch (error) {
//         logger.error(`Logout error: ${error}`);
//         next(error);
//     }
// };


/**
 * Request password reset
 * @route POST /api/auth/request-password-reset
 */
export const requestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {email} = req.body as requestResetPasswordInput 
        await authService.requestPasswordResetOtp(email);
        res.status(200).json({
            success: true,
            message: 'Password reset verification code sent to your email'
        });
    } catch (error) {
        logger.error(`Request password reset error: ${error}`);
        next(error);
    }
}


// verify otp for password reset
export const verifyPasswordResetOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {email,code} = req.body as VerificationCodeInput;
        if (!email) {
            throw new CustomError(400, "Email is required");
        }
        const result = await authService.verifyOtpForPasswordReset(email, code );

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            isVerified: result
        });
    } catch (error) {
        logger.error(`Verify password reset OTP error: ${error}`);
        next(error);
    }
};


// reset password
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { newPassword } = req.body as PasswordResetInput;
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    
        if (!token) {
            throw new CustomError(401, "Authentication token is required");
        }
    
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new CustomError(500, "JWT_SECRET is not defined in environment variables");
        }
        const decoded = jwt.verify(token, jwtSecret) as any;
        
        if (!decoded.id || decoded.purpose !== 'password_reset') {
            throw new CustomError(401, "Please provide a valid password reset token");
        }

        await authService.resetPassword(decoded.id, newPassword);

        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        logger.error(`Reset password error: ${error}`);
        next(error);
    }
};