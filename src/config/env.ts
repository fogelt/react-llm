import * as z from 'zod';

const EnvSchema = z.object({
  PRIMARY_BACKEND_URL: z.string().url(),
  API_URL: z.string().url(),
  UPLOAD_SERVER_URL: z.string().url(),

  ENABLE_API_MOCKING: z
    .string()
    .refine((s) => s === 'true' || s === 'false')
    .transform((s) => s === 'true')
    .optional(),
  APP_URL: z.string().url().optional().default('http://localhost:3000'),
  APP_MOCK_API_PORT: z.string().optional().default('8080'),
});

// This is the structure that createEnv MUST return
type EnvType = z.infer<typeof EnvSchema>;


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

  const parsedEnv = EnvSchema.safeParse(envVars);

  if (!parsedEnv.success) {
    const treeifiedError = z.treeifyError(parsedEnv.error);

    const fieldErrors = treeifiedError.properties;

    // If properties exists, we iterate through it. If not, we fall back to generic errors.
    const errorDetails = fieldErrors
      ? Object.entries(fieldErrors)
        .map(([k, v]) => {
          const errors = v?.errors || [];
          return errors.length > 0 ? `- ${k}: ${errors.join(', ')}` : null;
        })
        .filter((item) => item !== null)
        .join('\n')
      : `Generic Error: ${treeifiedError.errors.join(', ')}`;


    throw new Error(
      `Invalid env provided.
The following variables are missing or invalid:
${errorDetails}
`,
    );
  }

  return parsedEnv.data;
};

export const env = createEnv();