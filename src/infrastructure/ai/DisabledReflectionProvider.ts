import { AppError } from "@/domain/repositories/AppError";
import type {
  ReflectionProvider,
  ReflectionRequest,
  ReflectionResult,
} from "./ReflectionProvider";

/**
 * Default provider: AI reflection is not enabled in MVP.
 * Throws a clear, diagnosable error so callers degrade gracefully.
 */
export class DisabledReflectionProvider implements ReflectionProvider {
  async reflect(_request: ReflectionRequest): Promise<ReflectionResult> {
    throw new AppError(
      "ATLAS_INITIALIZATION_FAILED",
      "AI Reflection 暂未启用。"
    );
  }
}
