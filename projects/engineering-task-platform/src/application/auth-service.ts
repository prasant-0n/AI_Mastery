import { ApplicationError } from "./http-errors.js";
import { hashPassword, verifyPassword } from "./password-hashing.js";
import type { UserRepository } from "./repositories.js";
import type { TokenService } from "./token-service.js";

export interface RegisterUserInput {
  readonly id: string;
  readonly organizationId: string;
  readonly email: string;
  readonly password: string;
}

export class AuthService {
  public constructor(
    private readonly users: UserRepository,
    private readonly tokens: TokenService,
  ) {}

  public async register(input: RegisterUserInput) {
    if (input.password.length < 8) {
      throw new ApplicationError(
        "Password must contain at least 8 characters",
        "BAD_REQUEST",
      );
    }

    const existing = await this.users.findByOrganizationAndEmail(
      input.organizationId,
      input.email,
    );

    if (existing) {
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

    return {
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      accessToken: this.tokens.issue({
        userId: user.id,
        organizationId: user.organizationId,
      }),
    };
  }

  public async login(
    organizationId: string,
    email: string,
    password: string,
  ) {
    const user = await this.users.findByOrganizationAndEmail(
      organizationId,
      email,
    );

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new ApplicationError("Invalid credentials", "BAD_REQUEST");
    }

    return {
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      accessToken: this.tokens.issue({
        userId: user.id,
        organizationId: user.organizationId,
      }),
    };
  }
}
