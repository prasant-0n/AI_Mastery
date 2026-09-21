import { createHmac, timingSafeEqual } from "node:crypto";
import { ApplicationError } from "./http-errors.js";

export interface AccessTokenClaims {
  readonly userId: string;
  readonly organizationId: string;
  readonly expiresAt: number;
}

export class TokenService {
  public constructor(
    private readonly secret: string,
    private readonly ttlSeconds = 900,
  ) {
    if (secret.length < 32) {
      throw new Error("Access token secret must contain at least 32 characters");
    }
  }

  public issue(claims: Omit<AccessTokenClaims, "expiresAt">): string {
    const expiresAt = Math.floor(Date.now() / 1000) + this.ttlSeconds;
    const payload = this.encode({
      userId: claims.userId,
      organizationId: claims.organizationId,
      expiresAt,
    });

    return `${payload}.${this.sign(payload)}`;
  }

  public verify(token: string): AccessTokenClaims {
    const [payload, signature] = token.split(".");

    if (!payload || !signature) {
      throw new ApplicationError("Invalid access token", "BAD_REQUEST");
    }

    const expected = this.sign(payload);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      throw new ApplicationError("Invalid access token", "BAD_REQUEST");
    }

    let claims: AccessTokenClaims;

    try {
      claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AccessTokenClaims;
    } catch {
      throw new ApplicationError("Invalid access token", "BAD_REQUEST");
    }

    if (
      typeof claims.userId !== "string" ||
      typeof claims.organizationId !== "string" ||
      !Number.isInteger(claims.expiresAt) ||
      claims.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      throw new ApplicationError("Expired or invalid access token", "BAD_REQUEST");
    }

    return claims;
  }

  private encode(claims: AccessTokenClaims): string {
    return Buffer.from(JSON.stringify(claims)).toString("base64url");
  }

  private sign(payload: string): string {
    return createHmac("sha256", this.secret)
      .update(payload)
      .digest("base64url");
  }
}
