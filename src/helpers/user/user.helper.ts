import { user } from "prisma/generated";
import prisma from "src/config/prisma/prisma.client";

export const checkDuplicateField = async (field: string, value: string, userId: string): Promise<boolean> => {
    const count = await prisma.user.count({
      where: {
        [field]: value,
        NOT: { id: userId }
      }
    });
    return count > 0;
  };
  
  // Helper function to prepare user data for response
 export const sanitizeUserData = (user: user) => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  };