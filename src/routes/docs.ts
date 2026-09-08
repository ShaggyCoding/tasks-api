import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';

const openapiPath = path.join(process.cwd(), 'openapi.yaml');
const openapiDocument = yaml.load(fs.readFileSync(openapiPath, 'utf8')) as Record<string, unknown>;

const router = Router();

router.get('/openapi.yaml', (_req, res) => {
  res.type('text/yaml').send(fs.readFileSync(openapiPath, 'utf8'));
});

router.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

export default router;
