import {
  useState,
} from "react";

import {
  Bell,
  Search,
  FileWarning,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import { useAlerts } from "../hooks/useAlerts";

function Alerts() {
  const navigate = useNavigate();

  const [severity, setSeverity] =
    useState("");

  const [search, setSearch] =
    useState("");

  const {
    alerts,
    loading,
    error,
    refresh,
  } = useAlerts(severity);

  const filteredAlerts =
    alerts.filter((alert) => {
      if (!search) return true;

      const value =
        `${alert.wallet_address || ""} ${
          alert.reason || ""
        } ${alert.severity || ""}`.toLowerCase();

      return value.includes(
        search.toLowerCase()
      );
    });

  function raiseComplaint(alert, department) {
    const complaint = {
      complaint_type: "Bitcoin forensic investigation lead",
      submitted_to: department,
      generated_at: new Date().toISOString(),
      alert: {
        id: alert.id,
        wallet_address: alert.wallet_address || null,
        transaction_id:
          alert.transaction_id ||
          alert.evidence?.transaction_id ||
          null,
        severity: alert.severity,
        risk_score: Number(alert.risk_score || 0),
        confidence: Number(alert.confidence || 0),
        reason: alert.reason || "Suspicious activity detected.",
        evidence: alert.evidence || {},
        created_at: alert.created_at || null,
      },
      notice:
        "This is an offline complaint draft. Submit it through the department's official channel after analyst review.",
    };

    const blob = new Blob(
      [JSON.stringify(complaint, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${department.toLowerCase().replaceAll(" ", "-")}-complaint-${alert.id}.json`;
    link.click();
    URL.revokeObjectURL(url);

    const portal = department === "Reserve Bank of India"
      ? "https://cms.rbi.org.in/"
      : "https://www.cybercrime.gov.in/";

    window.open(portal, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="page">

      <div className="eyebrow">
        THREAT MONITORING
      </div>

      <div className="wallet-directory-header">

        <div>
          <h1>Alerts</h1>

          <p>
            Ranked suspicious activity
            detected by the forensic analysis
            pipeline.
          </p>
        </div>

        <Bell size={22} />

      </div>

      <div className="dashboard-search-panel">

        <Search size={19} />

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search wallet or alert reason..."
        />

      </div>

      <div className="wallet-filters">

        {[
          ["", "All"],
          ["critical", "Critical"],
          ["high", "High"],
          ["medium", "Medium"],
          ["low", "Low"],
        ].map(([value, label]) => (

          <button
            key={value}
            className={
              severity === value
                ? "filter-button active"
                : "filter-button"
            }
            onClick={() => {
              setSeverity(value);
              refresh();
            }}
          >
            {label}
          </button>

        ))}

      </div>

      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}

      <section className="glass-panel">

        <div className="eyebrow">
          RANKED ALERTS
        </div>

        <h2>
          Suspicious activity
        </h2>

        {loading ? (
          <div className="dashboard-empty-message">
            Loading alerts...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="dashboard-empty-message">
            No alerts found.
          </div>
        ) : (
          <div className="dashboard-table-wrap">

            <table className="forensic-table alerts-table">

              <thead>
                <tr>
                  <th>Wallet</th>
                  <th>Severity</th>
                  <th>Risk</th>
                  <th>Confidence</th>
                  <th>Transaction</th>
                  <th>Reason</th>
                  <th>Date</th>
                  <th>Complaint</th>
                </tr>
              </thead>

              <tbody>

                {filteredAlerts.map(
                  (alert) => (

                    <tr
                      key={alert.id}
                      onClick={() =>
                        navigate(
                          `/alert/${alert.id}`
                        )
                      }
                      style={{
                        cursor: "pointer",
                      }}
                    >

                      <td>
                        {alert.wallet_address ||
                          "-"}
                      </td>

                      <td>
                        <span
                          className={`risk-badge ${
                            alert.severity
                          }`}
                        >
                          {
                            alert.severity
                          }
                        </span>
                      </td>

                      <td>
                        {Number(
                          alert.risk_score || 0
                        ).toFixed(1)}
                      </td>

                      <td>
                        {Number(
                          alert.confidence || 0
                        ).toFixed(1)}
                        %
                      </td>

                      <td>
                        {alert.transaction_id ||
                          alert.evidence?.transaction_id ||
                          "-"}
                      </td>

                      <td>
                        {alert.reason}
                      </td>

                      <td>
                        {alert.created_at
                          ? new Date(
                              alert.created_at
                            ).toLocaleString()
                          : "-"}
                      </td>

                      <td>
                        <div className="alert-actions">
                          <button
                            type="button"
                            title="Download cyber security complaint draft"
                            onClick={(event) => {
                              event.stopPropagation();
                              raiseComplaint(alert, "Cyber Security Department");
                            }}
                          >
                            <FileWarning size={14} />
                            Cyber Security
                          </button>

                          <button
                            type="button"
                            title="Download RBI complaint draft"
                            onClick={(event) => {
                              event.stopPropagation();
                              raiseComplaint(alert, "Reserve Bank of India");
                            }}
                          >
                            <FileWarning size={14} />
                            RBI
                          </button>
                        </div>
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </div>
  );
}

export default Alerts;