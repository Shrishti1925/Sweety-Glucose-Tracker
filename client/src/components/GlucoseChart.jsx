
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

function GlucoseChart({ data = [] }) {
  return (
    <section className="report-section">
      <h2>Monthly Glucose Trends</h2>

      {data.length > 0 ? (
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="date"
                tickFormatter={(date) => date.slice(5)}
              />

              <YAxis
                domain={['auto', 'auto']}
                label={{
                  value: 'mg/dL',
                  angle: -90,
                  position: 'insideLeft',
                }}
              />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="avg_glucose"
                name="Average Glucose"
                stroke="#e75480"
                strokeWidth={3}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p>No glucose trend data available yet.</p>
      )}
    </section>
  );
}

export default GlucoseChart;
