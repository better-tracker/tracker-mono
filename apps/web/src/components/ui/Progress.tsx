export function Progress({ value }: { value: number }) {
  return (
    <div
      className="progress h-2 bg-line mt-3 [&_>_span]:block [&_>_span]:h-full [&_>_span]:bg-complete"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Project completion"
    >
      <span style={{ width: `${value}%` }} />
    </div>
  );
}
