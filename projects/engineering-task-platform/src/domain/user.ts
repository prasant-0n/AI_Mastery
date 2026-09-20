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
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail.includes("@")) {
    throw new Error("Invalid email address");
  }

  if (passwordHash.length === 0) {
    throw new Error("Password hash is required");
  }

  return {
    id,
    organizationId,
    email: normalizedEmail,
    passwordHash,
    createdAt,
  };
}
