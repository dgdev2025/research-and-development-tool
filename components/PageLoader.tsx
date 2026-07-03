interface PageLoaderProps {
  overlay?: boolean;
  message?: string;
}

export function PageLoader({
  overlay = false,
  message = "Loading...",
}: PageLoaderProps) {
  if (overlay) {
    return (
      <div className="page-loader-overlay" role="status" aria-live="polite">
        <div className="page-loader-card">
          <div className="page-loader-spinner" aria-hidden="true" />
          <p>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-loader-inline" role="status" aria-live="polite">
      <div className="page-loader-spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
