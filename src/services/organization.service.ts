import prisma from "src/config/prisma/prisma.client";
import CustomError from "src/shared/exceptions/CustomError";
import logger from "src/utils/logger";

export const createOrganization = async (name: string) => {
  try {
    const organization = await prisma.organization.create({
      data: { name: name }
    });

    if (!organization) {
      throw new CustomError(404, "Cannot Create Organization");
    }

    return {
      success: true,
      organization: organization
    };
  } catch (error) {
    logger.error(`Error in Organization/Create: ${error}`);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError(500, "Failed to Create Organization");
  }
};


export const addMemberToOrganization = async (memberData : {
    organization : string,
    userId : string
    role: string
}) => {
  try {
    const user = await prisma.organization.update({
      where : {
        id : memberData.organization
      },
      data : {

      }
    })

    const addOrganizationUser = await prisma.organizationUser.create({
        data: {
            organizationId: memberData.organization,
            userId: memberData.userId,
            role: memberData.role
        }
    })

    if (!user || !addOrganizationUser) {
      throw new CustomError(404, "Cannot Add Member to Organization");
    }

    return {
      success: true,
      user: user
    };
  } catch (error) {
    logger.error(`Error Adding user: ${error}`);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError(500, "Failed to Add user to Organization");
  }
};