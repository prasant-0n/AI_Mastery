import { ApplicationError } from "./http-errors.js";
import type { UserRepository } from "./repositories.js";

export interface AuthenticatedUser {
  readonly userId: string;
  readonly organizationId: string;
}

export async function requireUser(
  userId: string,
  users: UserRepository,
): Promise<AuthenticatedUser> {
  if (!userId) {
    throw new ApplicationError("Authentication required", "BAD_REQUEST");
  }

  const user = await users.findById(userId);

  if (!user) {
    throw new ApplicationError("Authenticated user not found", "NOT_FOUND");
  }

  return {
    userId: user.id,
    organizationId: user.organizationId,
  };
}

export function requireSameOrganization(
  authenticated: AuthenticatedUser,
  organizationId: string,
): void {
  if (authenticated.organizationId !== organizationId) {
    throw new ApplicationError("Organization access denied", "NOT_FOUND");
  }
}
