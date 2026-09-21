import { ApplicationError } from "./http-errors.js";
import type { UserRepository } from "./repositories.js";
import { createUser } from "../domain/user.js";

export interface CreateUserInput {
  readonly id: string;
  readonly organizationId: string;
  readonly email: string;
  readonly passwordHash: string;
}

export class UserService {
  public constructor(private readonly users: UserRepository) {}

  public async create(input: CreateUserInput) {
    const existing = await this.users.findByEmail(input.email);

    if (existing && existing.organizationId === input.organizationId) {
      throw new ApplicationError(
        "User email already exists in organization",
        "CONFLICT",
      );
    }

    const user = createUser(
      input.id,
      input.organizationId,
      input.email,
      input.passwordHash,
    );

    await this.users.create(user);
    return user;
  }

  public async getById(id: string) {
    const user = await this.users.findById(id);

    if (!user) {
      throw new ApplicationError("User not found", "NOT_FOUND");
    }

    return user;
  }
}
