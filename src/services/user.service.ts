import prisma from "src/config/prisma/prisma.client";
import { updateUserInfo } from "src/interfaces/DTOs/user";
import CustomError from "src/shared/exceptions/CustomError";
import logger from "src/utils/logger";
import { createJwtPayload, generateAndSaveRefreshToken, generateToken } from "src/helpers/auth/auth.helpers";
import * as bcrypt from 'bcrypt';
import { checkDuplicateField, sanitizeUserData } from "src/helpers/user/user.helper";

/**
 * Update user information
 * @param userId - ID of the user to update
 * @param userData - Data to update for the user
 * @returns Object with updated user information and optionally a new token
 */
export const updateUser = async (userId: string, userData: updateUserInfo) => {
  try {
    // Check if user exists and get current data in a single query
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        roles: true
      }
    });

    if (!existingUser) {
      throw new CustomError(404, "User not found");
    }

    // Perform parallel checks for duplicate username and email
    const checks = [];
    
    if (userData.username && userData.username !== existingUser.username) {
      checks.push(
        checkDuplicateField('username', userData.username, userId)
          .then(exists => {
            if (exists) throw new CustomError(409, "Username already exists");
          })
      );
    }

    if (userData.email && userData.email !== existingUser.email) {
      checks.push(
        checkDuplicateField('email', userData.email, userId)
          .then(exists => {
            if (exists) throw new CustomError(409, "Email already exists");
          })
      );
    }

    // Wait for all validation checks to complete
    await Promise.all(checks);

    // Check if roles are being updated
    const rolesChanged = userData.roles && 
      JSON.stringify(userData.roles.sort()) !== JSON.stringify(existingUser.roles.sort());

    // Prepare update data - hash password if provided
    if (userData.password) {
      const saltRounds = 10;
      userData.password = await bcrypt.hash(userData.password, saltRounds);
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: userData,
    });

    // Create response object with sanitized user data
    const response: any = {
      user: sanitizeUserData(updatedUser)
    };

    // Generate new token if roles changed
    if (rolesChanged) {
      const jwtPayload = createJwtPayload(updatedUser);
      response.accessToken = generateToken(jwtPayload);
      response.refreshToken = await generateAndSaveRefreshToken(userId);
      response.message = "User updated successfully. New token generated due to role change.";
      logger.info(`New token generated for user ${userId} due to role change`);
}

    return response;
  } catch (error) {
    logger.error(`Error updating user: ${error}`);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError(500, "Failed to update user information");
  }
};

/**
 * Get user details by ID
 * @param userId - ID of the user to fetch
 * @returns User details object
 */
export const getUserById = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new CustomError(404, "User not found");
    }

    return {
      success: true,
      user: sanitizeUserData(user)
    };
  } catch (error) {
    logger.error(`Error fetching user: ${error}`);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError(500, "Failed to fetch user information");
  }
};