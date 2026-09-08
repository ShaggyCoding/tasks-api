import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';
import { HttpError } from '../lib/http-error';

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new HttpError(400, result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')));
      return;
    }
    req.body = result.data;
    next();
  };
}
