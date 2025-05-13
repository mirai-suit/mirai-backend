import { Request, Response, NextFunction } from 'express';
import { Auth } from '../../middlewares/auth';
import { User } from '../../models/user';

export class AuthController {
  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      const token = await Auth.generateToken(user);
      res.json({ token });
    } catch (error) {
      next(error);
    }
  }

  public async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findOne({ where: { id: req.user.id } });
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      res.json({ user });
    } catch (error) {
      next(error);
    }
  }
}
