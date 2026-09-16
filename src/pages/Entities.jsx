import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  Wallet,
  Globe,
  ArrowLeftRight,
  Network,
  Users,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import client from "../api/client";


function Entities() {
  const navigate = useNavigate();

  const [entities, setEntities] =
    useState([]);

  const [clusters, setClusters] =
    useState([]);

  const [summary, setSummary] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [type, setType] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    let cancelled = false;

    async function loadEntities() {
      setLoading(true);
      setError("");

      try {
        const params =
          new URLSearchParams();

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        if (type) {
          params.set(
            "type",
            type
          );
        }

        params.set(
          "limit",
          "500"
        );

        const [
          entityData,
          clusterData,
          summaryData,
        ] = await Promise.all([
          client.get(
            `/entities?${params.toString()}`
          ),

          client.get(
            "/entities/clusters"
          ),

          client.get(
            "/entities/summary"
          ),
        ]);

        if (cancelled) {
          return;
        }

        setEntities(
          entityData.entities || []
        );

        setClusters(
          clusterData.clusters || []
        );

        setSummary(
          summaryData || null
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              "Unable to load entities."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEntities();

    return () => {
      cancelled = true;
    };
  }, [search, type]);


  const visibleClusters =
    useMemo(
      () =>
        clusters.slice(
          0,
          10
        ),
      [clusters]
    );


  function iconFor(
    entityType
  ) {
    if (
      entityType === "wallet"
    ) {
      return (
        <Wallet size={17} />
      );
    }

    if (
      entityType === "ip"
    ) {
      return (
        <Globe size={17} />
      );
    }

    return (
      <ArrowLeftRight
        size={17}
      />
    );
  }


  function openEntity(entity) {
    /*
     * Wallets already have a
     * dedicated investigation page.
     */
    if (
      entity.node_type ===
      "wallet"
    ) {
      navigate(
        `/wallet/${encodeURIComponent(
          entity.node_id
        )}`
      );

      return;
    }

    /*
     * IP and transaction entities
     * can be investigated through
     * the transaction graph.
     */
    navigate(
      `/graph?search=${encodeURIComponent(
        entity.node_id
      )}`
    );
  }


  function riskLabel(score) {
    const value =
      Number(score || 0);

    if (value >= 80) {
      return "Critical";
    }

    if (value >= 60) {
      return "High";
    }

    if (value >= 40) {
      return "Medium";
    }

    return "Low";
  }


  return (
    <div className="page">

      {/* HEADER */}

      <div className="eyebrow">
        ENTITY INTELLIGENCE
      </div>

      <div className="wallet-directory-header">

        <div>

          <h1>
            Entity Investigation
          </h1>

          <p>
            Correlate wallets,
            network IPs and
            transactions into
            connected investigative
            entities.
          </p>

        </div>

      </div>


      {/* SUMMARY */}

      <section className="dashboard-stats">

        {[
          [
            "Wallets",
            summary?.wallets,
            Wallet,
          ],

          [
            "Network IPs",
            summary?.ips,
            Globe,
          ],

          [
            "Transactions",
            summary?.transactions,
            ArrowLeftRight,
          ],

          [
            "Relationships",
            summary?.edges,
            Network,
          ],

          [
            "Clusters",
            summary?.clusters,
            Users,
          ],
        ].map(
          ([
            title,
            value,
            Icon,
          ]) => (

            <div
              className="glass-stat-card"
              key={title}
            >

              <div className="stat-icon">
                <Icon
                  size={21}
                  strokeWidth={1.8}
                />
              </div>

              <div className="stat-content">

                <span>
                  {title}
                </span>

                <strong>
                  {loading
                    ? "…"
                    : Number(
                        value || 0
                      ).toLocaleString()}
                </strong>

              </div>

            </div>

          )
        )}

      </section>


      {/* SEARCH */}

      <section className="dashboard-search-panel">

        <Search size={19} />

        <input
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search wallet address, IP address or transaction ID..."
        />

      </section>


      {/* FILTER */}

      <div className="wallet-filters">

        <select
          value={type}
          onChange={(event) =>
            setType(
              event.target.value
            )
          }
        >

          <option value="">
            All entity types
          </option>

          <option value="wallet">
            Wallets
          </option>

          <option value="ip">
            IP addresses
          </option>

          <option value="transaction">
            Transactions
          </option>

        </select>

      </div>


      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}


      {/* ENTITY DIRECTORY */}

      <section className="glass-panel">

        <div className="panel-title-row">

          <div>

            <div className="eyebrow">
              CONNECTED ENTITIES
            </div>

            <h2>
              {entities.length.toLocaleString()}{" "}
              entities
            </h2>

          </div>

          <Network size={18} />

        </div>


        {loading ? (

          <div className="dashboard-empty-message">
            Loading entities...
          </div>

        ) : entities.length === 0 ? (

          <div className="dashboard-empty-message">
            No entity relationships
            found. Run ingestion
            and analysis first.
          </div>

        ) : (

          <div className="dashboard-table-wrap">

            <table className="forensic-table">

              <thead>

                <tr>
                  <th>
                    Entity
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Connections
                  </th>

                  <th>
                    Investigation
                  </th>
                </tr>

              </thead>


              <tbody>

                {entities.map(
                  (entity) => (

                    <tr
                      key={`${entity.node_type}:${entity.node_id}`}
                      onClick={() =>
                        openEntity(
                          entity
                        )
                      }
                      style={{
                        cursor:
                          "pointer",
                      }}
                    >

                      <td>

                        <div className="wallet-address-cell">

                          {iconFor(
                            entity.node_type
                          )}

                          <span
                            title={
                              entity.node_id
                            }
                          >
                            {
                              entity.node_id
                            }
                          </span>

                        </div>

                      </td>


                      <td>

                        {String(
                          entity.node_type ||
                            ""
                        ).toUpperCase()}

                      </td>


                      <td>

                        {Number(
                          entity.connections ||
                            0
                        ).toLocaleString()}

                      </td>


                      <td>

                        {entity.node_type ===
                        "wallet"
                          ? "Open wallet"
                          : "Open graph"}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* CLUSTERS */}

      <section
        className="glass-panel"
        style={{
          marginTop: 24,
        }}
      >

        <div className="panel-title-row">

          <div>

            <div className="eyebrow">
              ENTITY CLUSTERS
            </div>

            <h2>
              Prioritized clusters
            </h2>

          </div>

          <Users size={18} />

        </div>


        {visibleClusters.length ===
        0 ? (

          <div className="dashboard-empty-message">
            No entity clusters are
            available yet. Run
            analysis to generate
            cluster records.
          </div>

        ) : (

          <div className="dashboard-table-wrap">

            <table className="forensic-table">

              <thead>

                <tr>

                  <th>
                    Cluster
                  </th>

                  <th>
                    Members
                  </th>

                  <th>
                    Risk
                  </th>

                  <th>
                    Confidence
                  </th>

                  <th>
                    Level
                  </th>

                </tr>

              </thead>


              <tbody>

                {visibleClusters.map(
                  (cluster) => (

                    <tr
                      key={
                        cluster.id
                      }
                    >

                      <td>
                        {
                          cluster.cluster_key ||
                          `Cluster ${cluster.id}`
                        }
                      </td>

                      <td>
                        {Number(
                          cluster.member_count ||
                            0
                        ).toLocaleString()}
                      </td>

                      <td>
                        {Number(
                          cluster.risk_score ||
                            0
                        ).toFixed(1)}
                      </td>

                      <td>
                        {Number(
                          cluster.confidence ||
                            0
                        ).toFixed(1)}
                        %
                      </td>

                      <td>
                        {riskLabel(
                          cluster.risk_score
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

    </div>
  );
}


export default Entities;