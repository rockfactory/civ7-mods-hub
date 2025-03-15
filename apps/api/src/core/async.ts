import { NextFunction, Request, Response } from 'express';

export function safeAsync(
  callback: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return function (req: Request, res: Response, next: NextFunction) {
    callback(req, res, next).catch(next);
  };
}
