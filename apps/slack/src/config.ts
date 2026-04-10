import { z } from "zod";

const envSchema = z.object({
  SLACK_BOT_TOKEN: z.string().startsWith("xoxb-", "Must be a valid Slack bot token"),
  SLACK_SIGNING_SECRET: z.string().min(1, "Signing secret is required"),
  SLACK_APP_TOKEN: z.string().startsWith("xapp-", "Must be a valid Slack app-level token"),
  API_URL: z.string().url().default("http://localhost:3001"),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(): Config {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Invalid environment configuration:");
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  return result.data;
}
