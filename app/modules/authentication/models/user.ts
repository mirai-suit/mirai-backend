export interface IUser {
  _id: string;
  email: string;
  password: string;
  name: string;
  avatar: string;
  role: 'admin' | 'user';
  workspaceIds: string[];
  teamIds: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  resetToken?: string;
  resetTokenExpires?: Date;
  __v: number;
}
