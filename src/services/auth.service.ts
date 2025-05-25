// signup service

import prisma from "src/config/prisma/prisma.client"
import { LoginInput, UserInput } from "src/interfaces/DTOs/auth"
import CustomError from "src/shared/exceptions/CustomError"
import * as bcrypt from 'bcrypt';
import { generateRandomCode, generateAndSaveRefreshToken, generateToken, sendVerificationEmail, revokeRefreshToken, verifyRefreshToken, createJwtPayload, sendPasswordResetEmail, createPasswordResetToken, deactivateOtp, deactivateUserOtps, validateOtp, findLatestValidOtp } from "src/helpers/auth/auth.helpers";
import logger from "src/utils/logger";
import { otpPurpose } from "src/interfaces/enums/auth";
import { Request, Response } from "express";
import dotenv from 'dotenv';

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account and sends verification email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       409:
 *         description: Email or username already exists
 *       500:
 *         description: Server error
 */
export const signUp= async (userData:UserInput)=>{

    // Check if the user already exists
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: userData.email },
                { username: userData.username }
            ]
        },
        select: { email: true, username: true }
    });

    if (existingUser) {
        if (existingUser.email === userData.email && existingUser.username === userData.username) {
            throw new CustomError(409, "Both email and username already exist");
        } else if (existingUser.email === userData.email) {
            throw new CustomError(409, "Email already exists");
        } else {
            throw new CustomError(409, "Username already exists");
        }
    }
    // Hash the password before creating the user
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Update userData.password with the hashed password
    userData.password = hashedPassword;

    const user = await prisma.user.create({
        data: {
            email: userData.email,
            username: userData.username,
            password: userData.password,
            firstName: userData.firstName,
            lastName: userData.lastName,
            roles: userData.roles,
        }
    })

    // Send verification code to the user's email
    const verificationCode = generateRandomCode();



    // await sendVerificationCode(user.email, verificationCode)

    if(!user) {
        throw new CustomError(500, "User creation failed")
    }

    // Optionally, you can generate a token for the user here
    const jwtPayload = createJwtPayload(user);
    const signUpToken = generateToken(jwtPayload);
    const refreshToken = await generateAndSaveRefreshToken(user.id);
    sendVerificationEmail(user.email, verificationCode).then(() => {
        logger.info(`Verification email sent to ${user.email}`);
        const otp = generateAndSaveOtp(user.id);
        logger.info(`OTP generated and saved for user ${otp}`);
    }).catch((error) => {
        logger.error(`Error sending verification email: ${error}`);
    });


    return {
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            roles: user.roles,
            isverified: user.isEmailVerified,
        },
        accessToken: signUpToken,
        refreshToken: refreshToken,
    }
}

// verify otp 
// Define OTP purpose enum if not already defined elsewhere

// =====================================
// Main OTP Verification Functions
// =====================================

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP for various purposes
 *     description: Validates the OTP sent to user and updates verification status
 *     parameters:
 *       - name: userId
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *       - name: otp
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *       - name: purpose
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *           enum: [email_verification, password_reset]
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: No valid OTP found
 */
export const verifyOtp = async (userId: string, otp: string, purpose: otpPurpose) => {
    try {
      // Find and validate OTP
      const otpRecord = await findLatestValidOtp(userId);
      if (!otpRecord) {
        throw new CustomError(400, 'No valid OTP found');
      }
      await validateOtp(otpRecord, otp);
      
      // Deactivate the used OTP
      
      await deactivateOtp(otpRecord.id);
      
      // For security, deactivate all other OTPs for this user
      await deactivateUserOtps(userId);
  
      // Handle different OTP purposes
      if (purpose === otpPurpose.email_verification) {
        // Update user's email verification status
        await prisma.user.update({
          where: { id: userId },
          data: { isEmailVerified: true }
        });
        return { verified: true, message: 'Email verification successful' };
      } 
      else if (purpose === otpPurpose.password_reset) { // not using rn beacuse we are using seperate function for password reset
        // Generate a short-lived token for password reset
        const { resetToken } = await createPasswordResetToken(userId);
        return { verified: true, resetToken };
      } 
      else {
        throw new CustomError(400, 'Invalid OTP purpose');
      }
    } catch (error) {
      logger.error(`Error verifying OTP: ${error}`);
      throw error;
    }
  };

/**
 * @swagger
 * /api/auth/verify-password-reset:
 *   post:
 *     summary: Verify OTP for password reset
 *     description: Validates the OTP sent for password reset and returns a reset token
 *     parameters:
 *       - name: email
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *       - name: otp
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully, reset token provided
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: User not found
 */
  export const verifyOtpForPasswordReset = async (email: string, otp: string) => {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });
  
      if (!user) {
        throw new CustomError(404, 'User not found');
      }
  
      // Find and validate OTP
      const otpRecord = await findLatestValidOtp(user.id);
      await validateOtp(otpRecord, otp);
        if (!otpRecord) {
            throw new CustomError(400, 'No valid OTP found');
        }
      
      // Deactivate the used OTP
      await deactivateOtp(otpRecord.id);
      
      // For security, deactivate all other OTPs for this user
      await deactivateUserOtps(user.id);
  
      // Generate reset token
      const { resetToken } = await createPasswordResetToken(user.id);
      
      return { 
        verified: true, 
        userId: user.id,
        resetToken,
        message: 'OTP verified successfully. You can now reset your password.' 
      };
    } catch (error) {
      logger.error(`Error verifying password reset OTP: ${error}`);
      throw error;
    }
  };



/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticates a user and returns access and refresh tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */
export const login = async (userData:LoginInput)=>{
    const user = await prisma.user.findFirst({
        where: {
            OR:[
                { email: userData.email },
            ]
        }
    })
    if (!user) {
        throw new CustomError(401, "Invalid credentials")
    }

    const isPasswordValid = await bcrypt.compare(userData.password, user.password)
    if (!isPasswordValid) {
        throw new CustomError(401, "Invalid Password")
    }

    // Optionally, you can generate a token for the user here
    const jwtPayload = createJwtPayload(user);
    const loginToken = generateToken(jwtPayload); // Token valid for 24 hours
    const refreshToken = await generateAndSaveRefreshToken(user.id);
    return {
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            roles: user.roles,
        },
        accessToken: loginToken,
        refreshToken: refreshToken,
    }
}

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh authentication tokens
 *     description: Uses a refresh token to generate a new pair of access and refresh tokens
 *     parameters:
 *       - name: refreshToken
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *       401:
 *         description: Invalid refresh token or user not found
 */
export const renewTokens= async (refreshToken: string) => {
        // Verify the refresh token using the helper function
        const {userId} = await verifyRefreshToken(refreshToken);
        
        // Fetch the user associated with the token
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            throw new CustomError(401, "User not found");
        }

        // Create JWT payload with user information
        const jwtPayload = createJwtPayload(user);
        // Generate new access token (valid for 24 hours)
        const newAccessToken = generateToken(jwtPayload);
        
        // Revoke the old refresh token for security
        await revokeRefreshToken(refreshToken);
        
        // Generate a new refresh token
        const newRefreshToken = await generateAndSaveRefreshToken(user.id);
        
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,

}
}

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the profile information of the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
export const findUserById = async (userId: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            throw new CustomError(404, "User not found");
        }

        return user;
    } catch (error) {
        logger.error(`Error finding user by ID: ${error}`);
        throw error;
    }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     OTP:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         otpHash:
 *           type: string
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         requestedAt:
 *           type: string
 *           format: date-time
 */
export const generateAndSaveOtp = async (userId: string) => {
    try {
        const otp = generateRandomCode();  
        const otpHash = await bcrypt.hash(otp, 10);
        logger.info(`Generated OTP: ${otp}`); // Logged the OTP for debugging purposes
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        const lastOtpRequest = await prisma.otp.findFirst({
            where: {
                userId,
            },
            orderBy: {
                requestedAt: 'desc',
            },
        });

        if (lastOtpRequest && (new Date().getTime() - lastOtpRequest.requestedAt.getTime()) < 60000) {
            throw new Error('You can only request a new OTP once per minute');
        }

        const otpRecord = await prisma.otp.create({
            data: {
                userId,
                otpHash,
                expiresAt,
                requestedAt: new Date(),
            },
        });

        logger.info(`Generated OTP for user ${userId}: ${otp}`);
        return otp;
    } catch (error) {
        logger.error(`Error generating OTP: ${error}`);
        throw error;
    }
};

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend verification OTP
 *     description: Generates a new OTP and sends it to the user's email
 *     parameters:
 *       - name: userId
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: User already verified
 *       404:
 *         description: User not found
 */
export const resendOtp = async (userId: string) => {
 // Find the user
 const user = await prisma.user.findUnique({
    where: { id: userId }
});

if (!user) {
    throw new CustomError(404, "User not found");
}

// Check if user is already verified
if (user.isEmailVerified) {
    throw new CustomError(400, "User is already verified");
}

// Generate a new OTP and save it
const otp = await generateAndSaveOtp(userId);

// Send the OTP to the user's email
await sendVerificationEmail(user.email, otp)
    .then(() => {
        logger.info(`Verification email resent to ${user.email}`);
    })
    .catch((error) => {
        logger.error(`Error sending verification email: ${error}`);
        throw new CustomError(500, "Failed to send verification email");
    });

return {
    success: true,
    message: "A new verification code has been sent to your email"
};
}

/**
 * @swagger
 * /api/auth/request-password-reset:
 *   post:
 *     summary: Request password reset
 *     description: Sends a password reset OTP to the user's email
 *     parameters:
 *       - name: email
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Password reset instructions sent
 *       404:
 *         description: User not found
 */
export const requestPasswordResetOtp = async (email: string) => {
    try {
        // Find the user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            throw new CustomError(404, "User not found");
        }

        // Generate a new OTP and save it
        const otp = await generateAndSaveOtp(user.id);


        // Send email with OTP for password reset
        await sendPasswordResetEmail(user.email, otp)
            .then(() => {
                logger.info(`Password reset OTP sent to ${user.email}`);
            })
            .catch((error) => {
                logger.error(`Error sending password reset email: ${error}`);
                throw new CustomError(500, "Failed to send password reset email");
            });

        return {
            success: true,
            message: "Password reset instructions have been sent to your email"
        };
    } catch (error) {

        logger.error(`Error requesting password reset OTP: ${error}`);
        throw error;
    }
};

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     description: Updates user password after verification
 *     parameters:
 *       - name: userId
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *       - name: newPassword
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       401:
 *         description: Invalid or expired token
 *       500:
 *         description: Password reset failed
 */
export const resetPassword = async (userId: string, newPassword: string) => {
    try {
        // Extract token from Authorization header

        // Hash the new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        // Update the user's password
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
        
        if (!updatedUser) {
            throw new CustomError(500, "Password reset failed");
        }
        
        // Revoke all refresh tokens for this user for security
        await prisma.refreshToken.deleteMany({
            where: { userId }
        });
        
        return {
            success: true,
            message: "Password has been reset successfully"
        };
    } catch (error: unknown) {
        logger.error(`Error resetting password: ${error}`);
        if (error instanceof Error && 
            (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
            throw new CustomError(401, "Invalid or expired token");
        }
        throw error;
    }
};