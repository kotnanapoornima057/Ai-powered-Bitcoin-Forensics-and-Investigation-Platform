import {
  useEffect,
  useState,
} from "react";

import {
  Search,
  Wallet,
  ArrowUpDown,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import client from "../api/client";

function Wallets() {
  const navigate = useNavigate();

  const [wallets, setWallets] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [severity, setSeverity] =
    useState("");

  const [sort, setSort] =
    useState("risk");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadWallets() {
      setLoading(true);
      setError("");

      try {
        const params =
          new URLSearchParams();

        if (search) {
          params.set("search", search);
        }

        if (severity) {
          params.set(
            "severity",
            severity
          );
        }

        params.set("sort", sort);

        const data =
          await client.get(
            `/wallets?${params.toString()}`
          );

        setWallets(
          data.wallets || []
        );
      } catch (error) {
        setError(
          error.message ||
            "Unable to load wallets."
        );
      } finally {
        setLoading(false);
      }
    }

    loadWallets();
  }, [search, severity, sort]);

  function riskClass(severity) {
    return `risk-badge ${String(
      severity || "low"
    ).toLowerCase()}`;
  }

  return (
    <div className="page">

      <div className="eyebrow">
        WALLET INTELLIGENCE
      </div>

      <div className="wallet-directory-header">
        <div>
          <h1>Unique Wallets</h1>

          <p>
            Investigate wallet behavior,
            transaction activity and risk.
          </p>
        </div>
      </div>

      <div className="dashboard-search-panel">

        <Search size={19} />

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search wallet address..."
        />

      </div>

      <div className="wallet-filters">

        <select
          value={severity}
          onChange={(e) =>
            setSeverity(e.target.value)
          }
        >
          <option value="">
            All risk levels
          </option>

          <option value="critical">
            Critical
          </option>

          <option value="high">
            High
          </option>

          <option value="medium">
            Medium
          </option>

          <option value="low">
            Low
          </option>
        </select>

        <select
          value={sort}
          onChange={(e) =>
            setSort(e.target.value)
          }
        >
          <option value="risk">
            Highest risk
          </option>

          <option value="transactions">
            Most transactions
          </option>

          <option value="volume">
            Highest volume
          </option>

          <option value="address">
            Address
          </option>
        </select>

      </div>

      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}

      <section className="glass-panel">

        <div className="panel-title-row">

          <div>
            <div className="eyebrow">
              WALLET DIRECTORY
            </div>

            <h2>
              {wallets.length} wallets
            </h2>
          </div>

          <ArrowUpDown size={18} />

        </div>

        {loading ? (
          <div className="dashboard-empty-message">
            Loading wallets...
          </div>
        ) : wallets.length === 0 ? (
          <div className="dashboard-empty-message">
            No wallets found. Upload a
            dataset from Data Ingestion.
          </div>
        ) : (
          <div className="dashboard-table-wrap">

            <table className="forensic-table">

              <thead>
                <tr>
                  <th>Wallet</th>
                  <th>Transactions</th>
                  <th>Volume</th>
                  <th>Counterparties</th>
                  <th>Risk</th>
                </tr>
              </thead>

              <tbody>

                {wallets.map((wallet) => (

                  <tr
                    key={
                      wallet.wallet_address
                    }
                    onClick={() =>
                      navigate(
                        `/wallet/${encodeURIComponent(
                          wallet.wallet_address
                        )}`
                      )
                    }
                    style={{
                      cursor: "pointer",
                    }}
                  >

                    <td>
                      <div className="wallet-address-cell">

                        <Wallet size={16} />

                        <span
                          title={
                            wallet.wallet_address
                          }
                        >
                          {
                            wallet.wallet_address
                          }
                        </span>

                      </div>
                    </td>

                    <td>
                      {
                        wallet.transaction_count
                      }
                    </td>

                    <td>
                      {Number(
                        wallet.total_input ||
                          0
                      ) +
                        Number(
                          wallet.total_output ||
                            0
                        )}
                    </td>

                    <td>
                      {
                        wallet.unique_counterparties
                      }
                    </td>

                    <td>
                      <span
                        className={riskClass(
                          wallet.severity
                        )}
                      >
                        {wallet.severity ||
                          "low"}
                      </span>
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

export default Wallets;