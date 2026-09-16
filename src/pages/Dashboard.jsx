import { useEffect, useState } from "react";
import {
  Activity,
  Wallet,
  Globe,
  AlertTriangle,
  ShieldAlert,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

function Dashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [summaryResponse, transactionsResponse] = await Promise.all([
        client.get("/dashboard/summary"),
        client.get(
          `/dashboard/transactions?limit=10${
            search ? `&search=${encodeURIComponent(search)}` : ""
          }`
        ),
      ]);

      setSummary(summaryResponse);
      setTransactions(transactionsResponse.transactions || []);
    } catch (e) {
      setError(e.message || "Unable to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  const cards = summary
    ? [
        ["Transactions", summary.transactions, Activity, "mint"],
        ["Unique Wallets", summary.wallets, Wallet, "lavender"],
        ["Network IPs", summary.ips, Globe, "blue"],
        ["Suspicious", summary.suspicious, AlertTriangle, "peach"],
        ["High Risk", summary.highRisk, ShieldAlert, "rose"],
      ]
    : [];

  return (
    <div className="page dashboard-page">
      {/* ================= HERO ================= */}
      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <div className="eyebrow">INVESTIGATION CONSOLE</div>

          <h1>Investigation Overview</h1>

          <p>
            Monitor Bitcoin transactions, wallets, network entities and
            suspicious behavior from your ingested forensic datasets.
          </p>
        </div>

        <div className="offline-pill">
          <span></span>
          LIVE BACKEND ANALYSIS
        </div>
      </section>

      {/* ================= SEARCH ================= */}
      <section className="dashboard-search-panel">
        <Search size={20} />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search wallet address, TXID, IP address, ASN or value..."
        />
      </section>

      {/* ================= ERROR ================= */}
      {error && <div className="auth-error">{error}</div>}

      {/* ================= STATISTICS ================= */}
      <section className="dashboard-stats">
        {cards.map(([title, value, Icon, cls]) => (
          <button
            key={title}
            type="button"
            className={`glass-stat-card ${cls} ${
              title === "Unique Wallets"
                ? "dashboard-clickable-card"
                : ""
            }`}
            onClick={
              title === "Unique Wallets"
                ? () => navigate("/wallets")
                : undefined
            }
          >
            <div className="stat-icon">
              <Icon size={21} strokeWidth={1.8} />
            </div>

            <div className="stat-content">
              <span>{title}</span>

              <strong>
                {loading ? "…" : value ?? 0}
              </strong>
            </div>
          </button>
        ))}
      </section>

      {/* ================= RECENT TRANSACTIONS ================= */}
      <section className="glass-panel dashboard-observations">
        <div className="wallet-directory-header">
          <div>
            <div className="eyebrow">RECENT OBSERVATIONS</div>

            <h2>Latest transactions</h2>
          </div>
        </div>

        {loading ? (
          <div className="dashboard-empty-message">
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="dashboard-empty-message">
            No transactions found. Upload a dataset from Ingestion.
          </div>
        ) : (
          <div className="dashboard-table-wrap">
            <table className="forensic-table">
              <thead>
                <tr>
                  <th>TXID</th>
                  <th>Timestamp</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Country</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td title={transaction.txid || "-"}>
                      {transaction.txid || "-"}
                    </td>

                    <td>
                      {transaction.timestamp
                        ? new Date(
                            transaction.timestamp
                          ).toLocaleString()
                        : "-"}
                    </td>

                    <td
                      title={
                        Array.isArray(transaction.input_addresses)
                          ? transaction.input_addresses.join(", ")
                          : "-"
                      }
                    >
                      {Array.isArray(transaction.input_addresses)
                        ? transaction.input_addresses.join(", ")
                        : "-"}
                    </td>

                    <td
                      title={
                        Array.isArray(transaction.output_addresses)
                          ? transaction.output_addresses.join(", ")
                          : "-"
                      }
                    >
                      {Array.isArray(transaction.output_addresses)
                        ? transaction.output_addresses.join(", ")
                        : "-"}
                    </td>

                    <td>
                      {transaction.geo_country || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;