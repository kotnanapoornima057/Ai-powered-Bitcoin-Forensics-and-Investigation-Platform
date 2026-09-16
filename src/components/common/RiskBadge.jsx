export default function RiskBadge({
  score,
  riskScore,
  severity
}) {
  const value = Number(
    score !== undefined
      ? score
      : riskScore
  );

  const safeValue = Number.isFinite(value)
    ? Math.max(0, Math.min(100, value))
    : 0;

  let label = "Low";
  let className = "risk-low";

  if (safeValue >= 80) {
    label = "Critical";
    className = "risk-critical";
  } else if (safeValue >= 60) {
    label = "High";
    className = "risk-high";
  } else if (safeValue >= 40) {
    label = "Medium";
    className = "risk-medium";
  }

  return (
    <span
      className={`risk-badge ${className}`}
      title={
        severity
          ? `Model classification: ${severity}`
          : "AI/ML wallet risk classification"
      }
    >
      {label} {safeValue.toFixed(1)}
    </span>
  );
}