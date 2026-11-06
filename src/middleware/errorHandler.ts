import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import config from '../config/env';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  if (!(error instanceof AppError)) {
    error = new AppError('Internal Server Error', 500);
  }

  const appError = error as AppError;

  const response: any = {
    status: appError.status,
    message: appError.message,
  };

  if (config.nodeEnv === 'development') {
    response.stack = appError.stack;
  }

  res.status(appError.statusCode).json(response);
};
