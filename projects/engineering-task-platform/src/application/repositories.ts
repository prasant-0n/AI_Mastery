import type { Organization } from "../domain/organization.js";
import type { Task } from "../domain/task.js";
import type { User } from "../domain/user.js";

export interface OrganizationRepository {
  create(organization: Organization): Promise<void>;
  findById(id: string): Promise<Organization | null>;
}

export interface UserRepository {
  create(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}

export interface TaskRepository {
  create(task: Task): Promise<void>;
  findById(id: string): Promise<Task | null>;
  update(task: Task): Promise<void>;
  listByOrganization(organizationId: string, limit: number, offset: number): Promise<readonly Task[]>;
}
