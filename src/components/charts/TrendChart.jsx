import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

function TrendChart({
  data = []
}) {

  return (
    <div className="h-[280px]">

      <ResponsiveContainer
        width="100%"
        height="100%"
      >

        <LineChart data={data}>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#374151"
          />

          <XAxis
            dataKey="date"
            stroke="#6b7280"
            fontSize={11}
          />

          <YAxis
            stroke="#6b7280"
            fontSize={11}
          />

          <Tooltip
            contentStyle={{
              background: "#111827",
              border: "1px solid #374151"
            }}
          />

          <Line
            type="monotone"
            dataKey="count"
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );
}

export default TrendChart;