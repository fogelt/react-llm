import * as z from 'zod';

const EnvSchema = z.object({
  JAVA_API_PORT: z.string().default('8080'),
  UPLOAD_SERVER_PORT: z.string().default('8081'),

  ENABLE_API_MOCKING: z
    .string()
    .refine((s) => s === 'true' || s === 'false')
    .transform((s) => s === 'true')
    .default(false),

  APP_URL: z.string().url().optional().default('http://localhost:3000'),
});

type EnvType = z.infer<typeof EnvSchema> & {
  PRIMARY_BACKEND_URL: string;
  UPLOAD_SERVER_URL: string;
};

const createEnv = (): EnvType => {
  const envVars = Object.entries(import.meta.env).reduce<
    Record<string, string>
  >((acc, curr) => {
    const [key, value] = curr;
    if (key.startsWith('VITE_APP_')) {
      acc[key.replace('VITE_APP_', '')] = value;
    }
    return acc;
  }, {});

  const parsed = EnvSchema.safeParse(envVars);

  if (!parsed.success) {
    throw new Error(`Invalid environment variables: ${JSON.stringify(parsed.error.format(), null, 2)}`);
  }

  // Dynamic Host Detection
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  return {
    ...parsed.data,
    PRIMARY_BACKEND_URL: `http://${currentHost}:${parsed.data.JAVA_API_PORT}`,
    UPLOAD_SERVER_URL: `http://${currentHost}:${parsed.data.UPLOAD_SERVER_PORT}`,
  };
};

export const env = createEnv();