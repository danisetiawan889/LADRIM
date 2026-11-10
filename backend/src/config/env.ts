import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().url(),
  DATABASE_URL: z.string(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  CSRF_SECRET: z.string().min(8),
  MIDTRANS_SERVER_KEY: z.string().default(''),
  MIDTRANS_IS_PRODUCTION: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  RAJAONGKIR_API_KEY: z.string().default(''),
  BREVO_SMTP_HOST: z.string().default('smtp-relay.brevo.com'),
  BREVO_SMTP_PORT: z.coerce.number().default(587),
  BREVO_SMTP_USER: z.string().default(''),
  BREVO_SMTP_PASS: z.string().default(''),
  EMAIL_FROM: z.string().default('"LADRIM" <setiawandanni22@gmail.com>'),
  BITESHIP_API_KEY: z.string().default(''),
});

export const env = schema.parse(process.env); // fail fast on bad config
