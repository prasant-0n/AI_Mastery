import { ApplicationError } from "./http-errors.js";
import type { UserRepository } from "./repositories.js";
import type { TokenService, AccessTokenClaims } from "./token-service.js";

export interface AuthenticatedUser {
  readonly userId: string;
  readonly organizationId: string;
}

export async function authenticateRequest(
  authorization: string | undefined,
  users: UserRepository,
  tokens: TokenService,
): Promise<AuthenticatedUser> {
  if (!authorization?.startsWith("Bearer ")) {
    throw new ApplicationError("Authentication required", "BAD_REQUEST");
  }

  const claims: AccessTokenClaims = tokens.verify(
    authorization.slice("Bearer ".length),
  );

  const user = await users.findById(claims.userId);

  if (!user || user.organizationId !== claims.organizationId) {
    throw new ApplicationError("Invalid authenticated identity", "NOT_FOUND");
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
