import { otpPurpose } from 'src/interfaces/enums/auth';
import { userSchema,  passwordResetRequestSchema,  passwordResetSchema, verificationCodeSchema } from 'src/interfaces/schemas/create/auth';
import { z } from 'zod';


// Inferred DTOs from the Zod schemas
export type UserInput = z.infer<typeof userSchema>;
export type VerificationCodeInput = z.infer<typeof verificationCodeSchema>;
export type LoginInput = z.infer<typeof userSchema>;
export type requestResetPasswordInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type UserAuth = z.infer<typeof userSchema>;

// Output DTOs
export interface AuthResponse {
    token: string;
    refreshToken?: string;
}

export interface UserOutput {
    id: string;
    email: string;
    username: string;
    roles: string[];
    isverified: boolean;
}

export interface VerificationResponse {
    success: boolean;
}

export interface PasswordResetResponse {
    success: boolean;
}
