import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import client from "../api/client";

function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReport() {
      try {
        const [summary, alerts, entities, clusters] = await Promise.all([
          client.get("/dashboard/summary"),
          client.get("/alerts"),
          client.get("/entities?limit=500"),
          client.get("/entities/clusters"),
        ]);

        setReport({
          generated_at: new Date().toISOString(),
          methodology: {
            model: "Dependency-Free Isolation Forest",
            algorithm: "Unsupervised anomaly detection",
            features: [
              "Transaction count",
              "Input/output volume",
              "IP and port diversity",
              "Counterparty diversity",
              "Geographic and ASN diversity",
              "Velocity and timing variability",
            ],
            risk_range: "0-100",
            thresholds: {
              low: "0-39",
              medium: "40-59",
              high: "60-79",
              critical: "80-100",
            },
            interpretation:
              "Scores prioritize unusual behavior for investigation; they do not prove criminal activity.",
          },
          summary,
          alerts: alerts.alerts || [],
          entities: entities.entities || [],
          clusters: clusters.clusters || [],
        });
      } catch (requestError) {
        setError(requestError.message || "Unable to generate report.");
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, []);

  function downloadReport() {
    if (!report) return;

    const blob = new Blob(
      [JSON.stringify(report, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bitcoin-forensics-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <div className="eyebrow">OFFLINE REPORTING</div>
          <h1>Investigation Report</h1>
          <p>Export the current forensic findings and evidence for offline review.</p>
        </div>
        <FileText size={28} />
      </section>

      {error && <div className="auth-error">{error}</div>}

      <section className="glass-panel">
        {loading ? (
          <div className="dashboard-empty-message">Preparing report...</div>
        ) : !report ? (
          <div className="dashboard-empty-message">No report data available.</div>
        ) : (
          <>
            <div className="panel-title-row">
              <div>
                <div className="eyebrow">REPORT READY</div>
                <h2>Forensic findings</h2>
              </div>
              <button type="button" className="primary-button" onClick={downloadReport}>
                <Download size={17} />
                Download JSON
              </button>
            </div>

            <div className="dashboard-stats">
              <div className="glass-stat-card"><span>Transactions</span><strong>{report.summary.transactions || 0}</strong></div>
              <div className="glass-stat-card"><span>Wallets</span><strong>{report.summary.wallets || 0}</strong></div>
              <div className="glass-stat-card"><span>Alerts</span><strong>{report.alerts.length}</strong></div>
              <div className="glass-stat-card"><span>Clusters</span><strong>{report.clusters.length}</strong></div>
            </div>

            <p className="record-count">
              Generated {new Date(report.generated_at).toLocaleString()} using {report.methodology.model}.
            </p>

            <div className="glass-panel" style={{ marginTop: "20px" }}>
              <div className="eyebrow">TECHNICAL METHOD</div>
              <h2>{report.methodology.algorithm}</h2>
              <p>
                Wallet behavior is represented by transaction, value, network,
                geographic, counterparty, velocity, and timing features. The
                Isolation Forest ranks observations that are isolated from the
                learned population, while feature percentiles explain the lead.
              </p>
              <p>{report.methodology.interpretation}</p>
            </div>

            <div className="glass-panel" style={{ marginTop: "20px" }}>
              <div className="eyebrow">RANKED EVIDENCE</div>
              {report.alerts.length === 0 ? (
                <p>No alerts were generated for the current dataset.</p>
              ) : (
                <div className="dashboard-table-wrap">
                  <table className="forensic-table">
                    <thead>
                      <tr>
                        <th>Wallet</th>
                        <th>Risk</th>
                        <th>Confidence</th>
                        <th>Transaction</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.alerts.slice(0, 100).map((alert) => (
                        <tr key={alert.id}>
                          <td>{alert.wallet_address || "-"}</td>
                          <td>{Number(alert.risk_score || 0).toFixed(1)}</td>
                          <td>{Number(alert.confidence || 0).toFixed(1)}%</td>
                          <td>{alert.transaction_id || alert.evidence?.transaction_id || "-"}</td>
                          <td>{alert.reason || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="glass-panel" style={{ marginTop: "20px" }}>
              <div className="eyebrow">CONNECTED COMPONENTS</div>
              {report.clusters.length === 0 ? (
                <p>No connected entity clusters were generated.</p>
              ) : (
                <div className="dashboard-table-wrap">
                  <table className="forensic-table">
                    <thead>
                      <tr>
                        <th>Cluster</th>
                        <th>Members</th>
                        <th>Risk</th>
                        <th>Confidence</th>
                        <th>Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.clusters.slice(0, 100).map((cluster) => {
                        const risk = Number(cluster.risk_score || 0);
                        const level = risk >= 80
                          ? "Critical"
                          : risk >= 60
                            ? "High"
                            : risk >= 40
                              ? "Medium"
                              : "Low";

                        return (
                          <tr key={cluster.id}>
                            <td>{cluster.cluster_key || `Cluster ${cluster.id}`}</td>
                            <td>{Number(cluster.member_count || 0).toLocaleString()}</td>
                            <td>{risk.toFixed(1)}</td>
                            <td>{Number(cluster.confidence || 0).toFixed(1)}%</td>
                            <td>{level}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default Reports;
