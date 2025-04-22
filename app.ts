
import createError, {HttpError} from 'http-errors';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import logger from 'morgan';
import indexRouter from './app/modules/authentication/routes/index';
import usersRouter from './app/modules/authentication/routes/users';

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/user', usersRouter);

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

// error handler
app.use((err:any , req: Request, res: Response, next: NextFunction) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({
    message: err.message,
    status:err.status || 500
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
export default app;