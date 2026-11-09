import GlucoseChart from "../components/GlucoseChart";
import ReadingList from "../components/ReadingList";
import AddReading from "../components/AddReading";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

import { getDailyReport, getPeriodReports } from "../services/reportService";
import { getReadings } from "../services/readingService";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [periods, setPeriods] = useState(null);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [dailyData, periodData, readingData] = await Promise.all([
        getDailyReport(),
        getPeriodReports(),
        getReadings(),
      ]);

      setReport(dailyData);
      setPeriods(periodData);
      setReadings(readingData.readings || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <p className="error-message">{error}</p>
        <button onClick={loadDashboard}>Retry</button>
      </div>
    );
  }

  const summary = report?.summary || {};
  const monthlySummary = periods?.month_to_date?.summary || {};
  const previousMonthSummary = periods?.previous_full_month?.summary || {};

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Sweety 💗</h1>
          <p>Blood Glucose Tracker</p>
        </div>

        <div>
          <span>Welcome, {user?.name || "User"}!</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main>
        <AddReading onReadingAdded={loadDashboard} />
        <h2>Today's Overview</h2>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Readings</h3>
            <p>{summary.total_readings ?? 0}</p>
          </div>

          <div className="stat-card">
            <h3>Average Glucose</h3>
            <p>
              {summary.average_glucose ?? "--"}
              <small> mg/dL</small>
            </p>
          </div>

          <div className="stat-card">
            <h3>Lowest Reading</h3>
            <p>{summary.min_glucose ?? "--"}</p>
          </div>

          <div className="stat-card">
            <h3>Highest Reading</h3>
            <p>{summary.max_glucose ?? "--"}</p>
          </div>
        </div>

        <section className="report-section">
          <h2>Today's Meal Breakdown</h2>

          {report?.meal_breakdown?.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Measurement Slot</th>
                    <th>Readings</th>
                    <th>Average</th>
                    <th>Minimum</th>
                    <th>Maximum</th>
                  </tr>
                </thead>

                <tbody>
                  {report.meal_breakdown.map((item) => (
                    <tr key={item.meal_context}>
                      <td>{item.meal_context.replaceAll("_", " ")}</td>
                      <td>{item.count}</td>
                      <td>{item.avg_glucose}</td>
                      <td>{item.min_glucose}</td>
                      <td>{item.max_glucose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No readings recorded today.</p>
          )}
        </section>

        <section className="report-section">
          <h2>Month-to-Date Summary</h2>
          <section className="report-section">
            <h2>Previous Full Month Summary</h2>
            <GlucoseChart data={periods?.month_to_date?.daily_trends || []} />

            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Readings</h3>
                <p>{previousMonthSummary.total_readings ?? 0}</p>
              </div>

              <div className="stat-card">
                <h3>Average Glucose</h3>
                <p>{previousMonthSummary.average_glucose ?? "--"}</p>
              </div>

              <div className="stat-card">
                <h3>Lowest Reading</h3>
                <p>{previousMonthSummary.lowest_reading ?? "--"}</p>
              </div>

              <div className="stat-card">
                <h3>Highest Reading</h3>
                <p>{previousMonthSummary.highest_reading ?? "--"}</p>
              </div>
            </div>
          </section>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Readings</h3>
              <p>{monthlySummary.total_readings ?? 0}</p>
            </div>

            <div className="stat-card">
              <h3>Average Glucose</h3>
              <p>{monthlySummary.average_glucose ?? "--"}</p>
            </div>

            <div className="stat-card">
              <h3>Lowest Reading</h3>
              <p>{monthlySummary.lowest_reading ?? "--"}</p>
            </div>

            <div className="stat-card">
              <h3>Highest Reading</h3>
              <p>{monthlySummary.highest_reading ?? "--"}</p>
            </div>
          </div>
        </section>

        <ReadingList readings={readings} onChanged={loadDashboard} />
      </main>
    </div>
  );
}

export default Dashboard;
