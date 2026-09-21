import { ApplicationError } from "./http-errors.js";
import { hashPassword, verifyPassword } from "./password-hashing.js";
import type { UserRepository } from "./repositories.js";

export interface RegisterUserInput {
  readonly id: string;
  readonly organizationId: string;
  readonly email: string;
  readonly password: string;
}

export class AuthService {
  public constructor(private readonly users: UserRepository) {}

  public async register(input: RegisterUserInput) {
    if (input.password.length < 8) {
      throw new ApplicationError(
        "Password must contain at least 8 characters",
        "BAD_REQUEST",
      );
    }

    const existing = await this.users.findByEmail(input.email);

    if (existing && existing.organizationId === input.organizationId) {
      throw new ApplicationError(
        "User email already exists in organization",
        "CONFLICT",
      );
    }

    const passwordHash = await hashPassword(input.password);

    const user = {
      id: input.id,
      organizationId: input.organizationId,
      email: input.email.trim().toLowerCase(),
      passwordHash,
      createdAt: new Date(),
    };

    await this.users.create(user);
    return user;
  }

  public async verifyCredentials(
    email: string,
    password: string,
  ) {
    const user = await this.users.findByEmail(email);

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new ApplicationError("Invalid credentials", "BAD_REQUEST");
    }

    return {
      userId: user.id,
      organizationId: user.organizationId,
    };
  }
}
