import prisma from "../config/prisma/prisma.client";

export const getBoardAccessList = async (boardId: string) => {
  return prisma.boardAccess.findMany({
    where: { boardId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
        },
      },
    },
  });
};
