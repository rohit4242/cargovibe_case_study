import type { ApiErrorBody, ApiErrorCode } from "@cargovibe/shared";
import { HTTP_STATUS_BY_CODE } from "@cargovibe/shared";

export class AppError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: unknown[],
  ) {
    super(message);
    this.name = "AppError";
  }

  toBody(): ApiErrorBody {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }

  get httpStatus(): number {
    return HTTP_STATUS_BY_CODE[this.code];
  }
}

export function notFound(message = "Parking request not found"): AppError {
  return new AppError("NOT_FOUND", message);
}

export function validationError(message: string, details?: unknown[]): AppError {
  return new AppError("VALIDATION_ERROR", message, details);
}

export function invalidTransition(message: string): AppError {
  return new AppError("INVALID_TRANSITION", message);
}
