import { AppError } from "@/domain/repositories/AppError";

interface ErrorStateProps {
  error: AppError | Error | unknown;
  onRetry?: () => void;
  compact?: boolean;
}

const DEFAULT_MESSAGE =
  "发生了未知错误，请稍后重试或检查浏览器本地存储设置。";

export function ErrorState({ error, onRetry, compact }: ErrorStateProps) {
  const message = AppError.isAppError(error)
    ? error.message
    : error instanceof Error
      ? error.message
      : DEFAULT_MESSAGE;

  return (
    <div className={compact ? "error-state compact" : "error-state"} role="alert">
      <p className="error-state-message">{message}</p>
      {onRetry ? (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          重试
        </button>
      ) : null}
    </div>
  );
}
