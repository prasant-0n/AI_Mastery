import type { OrganizationRepository, TaskRepository, UserRepository } from "./repositories.js";

export interface ApplicationContainer {
  readonly organizations: OrganizationRepository;
  readonly users: UserRepository;
  readonly tasks: TaskRepository;
}
