export interface ApiMeta {
  readonly requestId: string;
}

export interface ApiSuccess<T> {
  readonly data: T;
  readonly meta: ApiMeta;
}

export interface ApiErrorBody {
  readonly error: string;
  readonly code: string;
  readonly meta: ApiMeta;
}

export function success<T>(data: T, requestId: string): ApiSuccess<T> {
  return { data, meta: { requestId } };
}

export function failure(
  error: string,
  code: string,
  requestId: string,
): ApiErrorBody {
  return { error, code, meta: { requestId } };
}
