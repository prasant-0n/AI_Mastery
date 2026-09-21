import { ApplicationError } from "./http-errors.js";
import type { OrganizationRepository } from "./repositories.js";
import { createOrganization } from "../domain/organization.js";

export class OrganizationService {
  public constructor(private readonly organizations: OrganizationRepository) {}

  public async create(id: string, name: string) {
    const organization = createOrganization(id, name);

    if (await this.organizations.findById(id)) {
      throw new ApplicationError(
        "Organization already exists",
        "CONFLICT",
      );
    }

    await this.organizations.create(organization);
    return organization;
  }

  public async getById(id: string) {
    const organization = await this.organizations.findById(id);

    if (!organization) {
      throw new ApplicationError("Organization not found", "NOT_FOUND");
    }

    return organization;
  }
}
