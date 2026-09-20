import type { ApplicationContainer } from "./container.js";

export interface HealthResult {
  readonly status: "ok";
  readonly service: string;
}

export interface ReadinessResult {
  readonly status: "ready" | "not_ready";
  readonly database: "up" | "down";
}

export async function checkReadiness(
  container: ApplicationContainer,
): Promise<ReadinessResult> {
  try {
    const probe = await container.organizations.findById("__health_probe__");

    void probe;

    return {
      status: "ready",
      database: "up",
    };
  } catch {
    return {
      status: "not_ready",
      database: "down",
    };
  }
}

export function getHealth(): HealthResult {
  return {
    status: "ok",
    service: "engineering-task-platform",
  };
}
