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
  const normalizedName = name.trim();

  if (normalizedName.length < 2) {
    throw new Error("Organization name must contain at least 2 characters");
  }

  return {
    id,
    name: normalizedName,
    createdAt,
  };
}
