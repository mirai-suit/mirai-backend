import { UpdateUserSchema } from "src/interfaces/schemas/update/user";
import { z } from "zod";

export type updateUserInfo = z.infer<typeof UpdateUserSchema>;