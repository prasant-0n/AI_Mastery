import { ApplicationError } from "../application/http-errors.js";

const MAX_BODY_BYTES = 1_048_576;

export async function readJsonBody(
  request: AsyncIterable<Buffer | string>,
): Promise<unknown> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.byteLength;

    if (totalBytes > MAX_BODY_BYTES) {
      throw new ApplicationError("Request body is too large", "BAD_REQUEST");
    }

    chunks.push(buffer);
  }

  if (totalBytes === 0) {
    throw new ApplicationError("Request body is required", "BAD_REQUEST");
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApplicationError("Request body must be valid JSON", "BAD_REQUEST");
  }
}
