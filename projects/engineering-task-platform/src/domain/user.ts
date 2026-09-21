import { DomainInvariantError } from "./errors.js";

export interface User {
  readonly id: string;
  readonly organizationId: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly createdAt: Date;
}

export function createUser(
  id: string,
  organizationId: string,
  email: string,
  passwordHash: string,
  createdAt = new Date(),
): User {
  const normalizedId = id.trim();
  const normalizedOrganizationId = organizationId.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedId) {
    throw new DomainInvariantError("User id is required");
  }

  if (!normalizedOrganizationId) {
    throw new DomainInvariantError("User organizationId is required");
  }

  if (!normalizedEmail.includes("@")) {
    throw new DomainInvariantError("Invalid email address");
  }

  if (passwordHash.length === 0) {
    throw new DomainInvariantError("Password hash is required");
  }

  if (Number.isNaN(createdAt.getTime())) {
    throw new DomainInvariantError("User createdAt must be valid");
  }

  return {
    id: normalizedId,
    organizationId: normalizedOrganizationId,
    email: normalizedEmail,
    passwordHash,
    createdAt,
  };
}
