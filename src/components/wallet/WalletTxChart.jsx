import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function WalletTxChart({ data = [] }) {
  const chartData = Array.isArray(data) ? data : [];

  return (
    <div className="h-[300px] w-full">
      {chartData.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-gray-500">
          No transaction data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
            />

            <XAxis
              dataKey="date"
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip
              contentStyle={{
                background: "#111827",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#ffffff",
              }}
            />

            <Area
              type="monotone"
              dataKey="amount"
              stroke="#f97316"
              fill="#f97316"
              fillOpacity={0.12}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default WalletTxChart;