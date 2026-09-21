import type { OrganizationRepository, TaskRepository, UserRepository } from "./repositories.js";
import type { AuthService } from "./auth-service.js";
import type { TokenService } from "./token-service.js";

export interface ApplicationContainer {
  readonly organizations: OrganizationRepository;
  readonly users: UserRepository;
  readonly tasks: TaskRepository;
  readonly auth: AuthService;
  readonly tokens: TokenService;
}
