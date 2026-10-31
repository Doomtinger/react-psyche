/**
 * Unified, diagnosable error model.
 *
 * Every error carries a stable `code` so the UI can decide how to present it
 * without parsing human-readable messages. Personal record bodies must never
 * be attached to `details` in a way that ends up in console logs.
 */
export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "RECORD_NOT_FOUND"
  | "STORAGE_UNAVAILABLE"
  | "STORAGE_QUOTA_EXCEEDED"
  | "IMPORT_INVALID_FILE"
  | "IMPORT_VERSION_UNSUPPORTED"
  | "ATLAS_INITIALIZATION_FAILED"
  | "OPERATION_CANCELLED";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly details?: unknown;

  constructor(code: AppErrorCode, message?: string, details?: unknown) {
    super(message ?? code);
    this.name = "AppError";
    this.code = code;
    this.details = details;
    // Restore prototype chain for instanceof checks after transpilation.
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static isAppError(value: unknown): value is AppError {
    return value instanceof AppError;
  }
}
