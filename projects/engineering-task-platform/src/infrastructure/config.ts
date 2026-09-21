export interface AppConfig {
  readonly port: number;
  readonly databaseUrl: string;
  readonly accessTokenSecret: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const port = Number(env.PORT ?? 3000);
  const databaseUrl = env.DATABASE_URL;
  const accessTokenSecret = env.ACCESS_TOKEN_SECRET;

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  if (!accessTokenSecret || accessTokenSecret.length < 32) {
    throw new Error(
      "ACCESS_TOKEN_SECRET must contain at least 32 characters",
    );
  }

  return {
    port,
    databaseUrl,
    accessTokenSecret,
  };
}
