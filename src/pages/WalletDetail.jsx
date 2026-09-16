import React from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Wallet,
  Activity,
  Globe,
  AlertTriangle,
  Network,
  Clock,
} from "lucide-react";

import { useWalletDetail } from "../hooks/useWalletDetail";
import RiskBadge from "../components/common/RiskBadge";
import RiskBreakdown from "../components/wallet/RiskBreakdown";
import GraphCanvas from "../components/graph/GraphCanvas";
import { useWalletGraph } from "../hooks/useWalletGraph";


function formatNumber(value) {
  const number = Number(value || 0);

  return number.toLocaleString(
    undefined,
    {
      maximumFractionDigits: 4,
    }
  );
}


function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}


function shorten(value, start = 12, end = 8) {
  if (!value) {
    return "—";
  }

  const text = String(value);

  if (text.length <= start + end + 3) {
    return text;
  }

  return `${text.slice(0, start)}...${text.slice(-end)}`;
}


function getRiskScore(wallet) {
  return Number(
    wallet?.risk_score ??
    wallet?.riskScore ??
    0
  );
}


function getConfidence(wallet) {
  return Number(
    wallet?.confidence ??
    wallet?.confidence_score ??
    0
  );
}


function getTransactionId(transaction) {
  return (
    transaction?.txid ||
    transaction?.transaction_id ||
    transaction?.id ||
    ""
  );
}


function WalletDetail() {
  const { address } = useParams();

  const decodedAddress =
    decodeURIComponent(address || "");

  const {
    wallet,
    transactions,
    alerts,
    breakdown,
    loading,
    error,
  } = useWalletDetail(decodedAddress);

  const {
    graph,
    loading: graphLoading,
    error: graphError,
  } = useWalletGraph(decodedAddress);


  if (loading) {
    return (
      <div className="page">

        <div
          style={{
            paddingTop: 40,
            color: "#94a3b8",
          }}
        >
          Loading wallet investigation...
        </div>

      </div>
    );
  }


  if (error) {
    return (
      <div className="page">

        <Link
          to="/wallets"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={18} />

          Back to wallets
        </Link>


        <div className="auth-error">
          {error}
        </div>

      </div>
    );
  }


  if (!wallet) {
    return (
      <div className="page">

        <Link
          to="/wallets"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={18} />

          Back to wallets
        </Link>


        <div className="dashboard-empty-message">
          Wallet not found.
        </div>

      </div>
    );
  }


  const riskScore =
    getRiskScore(wallet);

  const confidence =
    getConfidence(wallet);

  const walletTransactions =
    Array.isArray(transactions)
      ? transactions
      : [];

  const walletAlerts =
    Array.isArray(alerts)
      ? alerts
      : [];

  const walletBreakdown =
    Array.isArray(breakdown)
      ? breakdown
      : [];

  const graphElements = [
    ...(graph.nodes || []).map((node) => ({
      data: {
        id: node.id,
        label: shorten(node.label, 10, 6),
        color: node.type === "wallet"
          ? "#8b5cf6"
          : node.type === "transaction"
            ? "#3b82f6"
            : "#10b981",
      },
    })),
    ...(graph.edges || []).map((edge) => ({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.relation || "related",
      },
    })),
  ];


  /*
   * Use the actual profile values
   * calculated by the analysis service.
   */
  const transactionCount =
    Number(
      wallet.transaction_count || 0
    );

  const uniqueIps =
    Number(
      wallet.unique_ips || 0
    );

  const counterparties =
    Number(
      wallet.unique_counterparties || 0
    );

  const totalInput =
    Number(
      wallet.total_input || 0
    );

  const totalOutput =
    Number(
      wallet.total_output || 0
    );


  return (
    <div className="page">

      {/* BACK */}

      <Link
        to="/wallets"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <ArrowLeft size={18} />

        Back to wallets
      </Link>


      {/* HEADER */}

      <div
        className="eyebrow"
        style={{
          marginTop: 4,
        }}
      >
        WALLET INVESTIGATION
      </div>


      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 24,
          marginTop: 8,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >

        <div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <Wallet size={28} />

            <h1>
              Wallet Investigation
            </h1>
          </div>


          <div
            style={{
              fontFamily:
                "monospace",
              wordBreak:
                "break-all",
              color:
                "#cbd5e1",
            }}
          >
            {decodedAddress}
          </div>

        </div>


        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >

          <div>

            <div
              style={{
                fontSize: 12,
                color: "#94a3b8",
                marginBottom: 4,
              }}
            >
              Risk score
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {riskScore.toFixed(1)}
            </div>

          </div>

          <RiskBadge
            value={riskScore}
          />

        </div>

      </div>


      {/* STAT CARDS */}

      <section className="dashboard-stats">

        <div className="glass-stat-card">

          <div className="stat-icon">
            <Activity
              size={21}
              strokeWidth={1.8}
            />
          </div>

          <div className="stat-content">

            <span>
              Transactions
            </span>

            <strong>
              {transactionCount.toLocaleString()}
            </strong>

          </div>

        </div>


        <div className="glass-stat-card">

          <div className="stat-icon">
            <Globe
              size={21}
              strokeWidth={1.8}
            />
          </div>

          <div className="stat-content">

            <span>
              Unique IPs
            </span>

            <strong>
              {uniqueIps.toLocaleString()}
            </strong>

          </div>

        </div>


        <div className="glass-stat-card">

          <div className="stat-icon">
            <Network
              size={21}
              strokeWidth={1.8}
            />
          </div>

          <div className="stat-content">

            <span>
              Counterparties
            </span>

            <strong>
              {counterparties.toLocaleString()}
            </strong>

          </div>

        </div>


        <div className="glass-stat-card">

          <div className="stat-icon">
            <AlertTriangle
              size={21}
              strokeWidth={1.8}
            />
          </div>

          <div className="stat-content">

            <span>
              Alerts
            </span>

            <strong>
              {walletAlerts.length.toLocaleString()}
            </strong>

          </div>

        </div>

      </section>


      {/* RISK ANALYSIS */}

      <section
        className="glass-panel"
        style={{
          marginTop: 24,
        }}
      >

        <div className="panel-title-row">

          <div>

            <div className="eyebrow">
              RISK ANALYSIS
            </div>

            <h2>
              Why this wallet was flagged
            </h2>

          </div>

          <AlertTriangle size={19} />

        </div>


        <div
          style={{
            marginTop: 18,
          }}
        >

          {walletBreakdown.length > 0 ? (

            <RiskBreakdown
              breakdown={
                walletBreakdown
              }
            />

          ) : (

            <div
              style={{
                color: "#94a3b8",
              }}
            >
              No detailed risk
              breakdown is available
              for this wallet.
            </div>

          )}

        </div>


        {/* CONFIDENCE */}

        <div
          style={{
            marginTop: 24,
            paddingTop: 18,
            borderTop:
              "1px solid rgba(255,255,255,0.08)",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              marginBottom: 8,
            }}
          >

            <span
              style={{
                color: "#94a3b8",
              }}
            >
              Model confidence
            </span>

            <strong>
              {confidence.toFixed(1)}%
            </strong>

          </div>


          <div
            style={{
              height: 7,
              borderRadius: 999,
              background:
                "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >

            <div
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    confidence
                  )
                )}%`,
                height: "100%",
                background:
                  "currentColor",
                borderRadius: 999,
              }}
            />

          </div>

        </div>

      </section>


      {/* WALLET VOLUME */}

      <section
        className="glass-panel"
        style={{
          marginTop: 24,
        }}
      >

        <div className="panel-title-row">

          <div>

            <div className="eyebrow">
              TRANSACTION VOLUME
            </div>

            <h2>
              Wallet activity
            </h2>

          </div>

          <Activity size={19} />

        </div>


        <div
          className="dashboard-stats"
          style={{
            marginTop: 18,
          }}
        >

          <div className="glass-stat-card">

            <div className="stat-content">

              <span>
                Total input
              </span>

              <strong>
                {formatNumber(
                  totalInput
                )}
              </strong>

            </div>

          </div>


          <div className="glass-stat-card">

            <div className="stat-content">

              <span>
                Total output
              </span>

              <strong>
                {formatNumber(
                  totalOutput
                )}
              </strong>

            </div>

          </div>


          <div className="glass-stat-card">

            <div className="stat-content">

              <span>
                Countries
              </span>

              <strong>
                {Number(
                  wallet.unique_countries ||
                    0
                ).toLocaleString()}
              </strong>

            </div>

          </div>


          <div className="glass-stat-card">

            <div className="stat-content">

              <span>
                ASNs
              </span>

              <strong>
                {Number(
                  wallet.unique_asns ||
                    0
                ).toLocaleString()}
              </strong>

            </div>

          </div>

        </div>

      </section>


      {/* ALERTS */}

      <section
        className="glass-panel"
        style={{
          marginTop: 24,
        }}
      >

        <div className="panel-title-row">

          <div>

            <div className="eyebrow">
              SECURITY ALERTS
            </div>

            <h2>
              Wallet alerts
            </h2>

          </div>

          <AlertTriangle size={19} />

        </div>


        {walletAlerts.length === 0 ? (

          <div
            className="dashboard-empty-message"
            style={{
              marginTop: 16,
            }}
          >
            No alerts are associated
            with this wallet.
          </div>

        ) : (

          <div
            className="dashboard-table-wrap"
            style={{
              marginTop: 16,
            }}
          >

            <table className="forensic-table">

              <thead>

                <tr>

                  <th>
                    Severity
                  </th>

                  <th>
                    Risk
                  </th>

                  <th>
                    Confidence
                  </th>

                  <th>
                    Reason
                  </th>

                  <th>
                    Created
                  </th>

                </tr>

              </thead>


              <tbody>

                {walletAlerts.map(
                  (alert) => (

                    <tr
                      key={alert.id}
                    >

                      <td>
                        <RiskBadge
                          value={
                            Number(
                              alert.risk_score ||
                                0
                            )
                          }
                        />
                      </td>

                      <td>
                        {Number(
                          alert.risk_score ||
                            0
                        ).toFixed(1)}
                      </td>

                      <td>
                        {Number(
                          alert.confidence ||
                            0
                        ).toFixed(1)}
                        %
                      </td>

                      <td>
                        {alert.reason ||
                          "AI anomaly detected"}
                      </td>

                      <td>
                        {formatDate(
                          alert.created_at
                        )}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* WALLET GRAPH */}

      <section
        className="glass-panel"
        style={{
          marginTop: 24,
        }}
      >
        <div className="panel-title-row">
          <div>
            <div className="eyebrow">WALLET LINK ANALYSIS</div>
            <h2>Wallet-specific relationships</h2>
          </div>
          <Network size={19} />
        </div>

        {graphLoading ? (
          <div className="dashboard-empty-message">
            Loading wallet relationships...
          </div>
        ) : graphError ? (
          <div className="auth-error">{graphError}</div>
        ) : graphElements.length === 0 ? (
          <div className="dashboard-empty-message">
            No relationships found for this wallet.
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            <GraphCanvas elements={graphElements} height={520} />
          </div>
        )}
      </section>

      {/* TRANSACTION HISTORY */}

      <section
        className="glass-panel"
        style={{
          marginTop: 24,
        }}
      >

        <div className="panel-title-row">

          <div>

            <div className="eyebrow">
              TRANSACTION HISTORY
            </div>

            <h2>
              Latest transactions
            </h2>

          </div>

          <Clock size={19} />

        </div>


        <div
          style={{
            marginTop: 8,
            color: "#94a3b8",
            fontSize: 13,
          }}
        >
          Showing the latest{" "}
          {Math.min(
            100,
            walletTransactions.length
          )}{" "}
          transactions for this
          wallet.
        </div>


        {walletTransactions.length ===
        0 ? (

          <div
            className="dashboard-empty-message"
            style={{
              marginTop: 16,
            }}
          >
            No transaction records
            are available.
          </div>

        ) : (

          <div
            className="dashboard-table-wrap"
            style={{
              marginTop: 16,
            }}
          >

            <table className="forensic-table">

              <thead>

                <tr>

                  <th>
                    Time
                  </th>

                  <th>
                    TXID
                  </th>

                  <th>
                    Source IP
                  </th>

                  <th>
                    Destination IP
                  </th>

                  <th>
                    Direction
                  </th>

                  <th>
                    Amount
                  </th>

                </tr>

              </thead>


              <tbody>

                {walletTransactions.map(
                  (transaction, index) => {

                    const txid =
                      getTransactionId(
                        transaction
                      );

                    return (
                      <tr
                        key={
                          transaction.id ||
                          txid ||
                          index
                        }
                      >

                        <td>
                          {formatDate(
                            transaction.timestamp
                          )}
                        </td>

                        <td
                          title={txid}
                          style={{
                            fontFamily:
                              "monospace",
                          }}
                        >
                          {shorten(txid)}
                        </td>

                        <td
                          style={{
                            fontFamily:
                              "monospace",
                          }}
                        >
                          {transaction.src_ip ||
                            "—"}
                        </td>

                        <td
                          style={{
                            fontFamily:
                              "monospace",
                          }}
                        >
                          {transaction.dst_ip ||
                            "—"}
                        </td>

                        <td>
                          {transaction.direction ||
                            "—"}
                        </td>

                        <td>
                          {formatNumber(
                            transaction.amount ??
                              transaction.output_amount ??
                              transaction.input_amount ??
                              0
                          )}
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* GRAPH NOTICE */}

      <section
        className="glass-panel"
        style={{
          marginTop: 24,
          marginBottom: 32,
        }}
      >

        <div className="panel-title-row">

          <div>

            <div className="eyebrow">
              NETWORK GRAPH
            </div>

            <h2>
              Connected entity analysis
            </h2>

          </div>

          <Network size={19} />

        </div>


        <div
          style={{
            marginTop: 16,
            color: "#94a3b8",
          }}
        >
          The wallet investigation
          data is loaded independently
          from the graph engine.
        </div>


        <Link
          to="/graph"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginTop: 16,
          }}
        >
          Open Transaction Graph
        </Link>

      </section>

    </div>
  );
}


export default WalletDetail;