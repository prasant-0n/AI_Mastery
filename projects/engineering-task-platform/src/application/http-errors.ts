export type HttpErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE_ENTITY"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_ERROR";

export class ApplicationError extends Error {
  public constructor(
    message: string,
    public readonly code: HttpErrorCode,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

export function toHttpError(error: unknown): {
  status: number;
  body: { error: string; code: HttpErrorCode };
} {
  if (error instanceof ApplicationError) {
    const statusByCode: Record<HttpErrorCode, number> = {
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      CONFLICT: 409,
      UNPROCESSABLE_ENTITY: 422,
      TOO_MANY_REQUESTS: 429,
      INTERNAL_ERROR: 500,
    };

    return {
      status: statusByCode[error.code],
      body: { error: error.message, code: error.code },
    };
  }

  return {
    status: 500,
    body: { error: "Internal server error", code: "INTERNAL_ERROR" },
  };
}
