export interface AppConfig {
  readonly port: number;
  readonly databaseUrl: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const port = Number(env.PORT ?? 3000);
  const databaseUrl = env.DATABASE_URL;

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  return {
    port,
    databaseUrl,
  };
}
