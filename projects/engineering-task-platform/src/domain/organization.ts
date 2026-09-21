import { DomainInvariantError } from "./errors.js";

export interface Organization {
  readonly id: string;
  readonly name: string;
  readonly createdAt: Date;
}

export function createOrganization(
  id: string,
  name: string,
  createdAt = new Date(),
): Organization {
  const normalizedId = id.trim();
  const normalizedName = name.trim();

  if (!normalizedId) {
    throw new DomainInvariantError("Organization id is required");
  }

  if (normalizedName.length < 2) {
    throw new DomainInvariantError(
      "Organization name must contain at least 2 characters",
    );
  }

  if (Number.isNaN(createdAt.getTime())) {
    throw new DomainInvariantError("Organization createdAt must be valid");
  }

  return {
    id: normalizedId,
    name: normalizedName,
    createdAt,
  };
}
