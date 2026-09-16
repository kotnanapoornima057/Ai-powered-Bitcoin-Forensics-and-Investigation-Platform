function RiskBreakdown({
  breakdown = []
}) {

  if (!breakdown.length) {

    return (
      <div className="text-gray-500 text-sm">
        No risk explanation available.
      </div>
    );

  }

  return (
    <div className="space-y-5">

      {breakdown.map((item) => {

        const percentage =
          Math.min(
            100,
            Math.max(
              0,
              Number(item.value) || 0
            )
          );

        return (
          <div key={item.name}>

            <div className="flex justify-between mb-2">

              <span className="text-sm text-gray-400">
                {item.name}
              </span>

              <span className="text-sm font-mono">
                {percentage.toFixed(0)}%
              </span>

            </div>

            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">

              <div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                style={{
                  width: `${percentage}%`
                }}
              />

            </div>

            <p className="text-xs text-gray-600 mt-1">
              {item.description}
            </p>

          </div>
        );

      })}

    </div>
  );
}

export default RiskBreakdown;