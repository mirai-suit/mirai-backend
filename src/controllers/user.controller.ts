
// update user info
import { NextFunction, Request, Response } from "express";
import { updateUserInfo } from "src/interfaces/DTOs/user";
import CustomError from "src/shared/exceptions/CustomError";
import logger from "src/utils/logger";
import * as userService from "src/services/user.service";




export const updateUser = async (req: Request, res: Response , next: NextFunction) => {
    try {
        const userId = req.user.id;
        const userData: updateUserInfo = req.body;
    
        // Call the user service to update user information
        const updatedUser = await userService.updateUser(userId, userData);
    
        // Return the updated user information
        res.status(200).json({
        success: true,
        message: "User information updated successfully",
        data: updatedUser,
        });
    } catch (error) {
        next(error);
    }
    }