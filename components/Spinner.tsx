export default function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="#E5E7EB" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#F06292" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
