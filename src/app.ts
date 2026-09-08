import express, { Express } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import notesRoutes from './routes/notes';
import docsRoutes from './routes/docs';
import { notFoundHandler, errorHandler } from './middleware/error';

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/auth', authRoutes);
  app.use('/notes', notesRoutes);
  app.use(docsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
