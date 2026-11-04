type ToastProps = {
  message: string | null;
};

export function Toast({ message }: ToastProps) {
  return (
    <div className="toast-wrap" aria-live="polite" role="status">
      {message ? (
        <div className="toast" data-testid="toast">
          <span className="toast-dot" aria-hidden="true" />
          <span>{message}</span>
        </div>
      ) : null}
    </div>
  );
}
