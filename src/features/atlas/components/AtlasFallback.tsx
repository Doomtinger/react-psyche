import Link from "next/link";

interface AtlasFallbackProps {
  title: string;
  message: string;
}

/**
 * Shown when WebGL is unavailable or the 3D scene fails to initialize.
 * The user must still be able to access and manage their records.
 */
export function AtlasFallback({ title, message }: AtlasFallbackProps) {
  return (
    <div className="atlas-fallback" role="alert">
      <div className="atlas-fallback-icon" aria-hidden="true">
        ◍
      </div>
      <h2 className="atlas-fallback-title">{title}</h2>
      <p className="atlas-fallback-message">{message}</p>
      <Link href="/timeline" className="btn btn-primary">
        转到时间线管理记录
      </Link>
    </div>
  );
}
