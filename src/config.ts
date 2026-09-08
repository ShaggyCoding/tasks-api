import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Fehlende Umgebungsvariable: ${name}`);
  }
  return value;
}

const config = {
  port: Number(process.env.PORT || 3000),
  databaseUrl: required('DATABASE_URL', 'postgres://tasks:tasks@localhost:5432/tasks'),
  jwtSecret: required('JWT_SECRET', 'dev-secret-do-not-use-in-production'),
  isTest: process.env.NODE_ENV === 'test',
};

export default config;
