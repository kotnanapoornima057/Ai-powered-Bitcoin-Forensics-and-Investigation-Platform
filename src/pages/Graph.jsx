import { useEffect, useMemo, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import {
  Activity,
  Network,
  Wallet,
  Globe,
  Search,
  ArrowRight
} from "lucide-react";

import client from "../api/client";


function Graph() {

  const [graph, setGraph] = useState({
    nodes: [],
    edges: [],
    summary: {
      nodes: 0,
      edges: 0,
      wallets: 0,
      transactions: 0,
      ips: 0
    }
  });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [type, setType] =
    useState("all");

  const [search, setSearch] =
    useState("");


  /*
   * ------------------------------------------------------------
   * LOAD GRAPH
   * ------------------------------------------------------------
   */

  useEffect(() => {

    let cancelled = false;

    async function loadGraph() {

      setLoading(true);
      setError("");

      try {

        const response =
          await client.get(
            `/graph?limit=220&type=${encodeURIComponent(
              type
            )}`
          );

        if (cancelled) {
          return;
        }

        setGraph({
          nodes:
            response.nodes || [],

          edges:
            response.edges || [],

          summary:
            response.summary || {
              nodes: 0,
              edges: 0,
              wallets: 0,
              transactions: 0,
              ips: 0
            }
        });

      } catch (error) {

        if (cancelled) {
          return;
        }

        console.error(
          "Graph loading error:",
          error
        );

        setError(
          error.message ||
          "Unable to load transaction graph."
        );

      } finally {

        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadGraph();

    return () => {
      cancelled = true;
    };

  }, [type]);


  /*
   * ------------------------------------------------------------
   * FILTER GRAPH
   * ------------------------------------------------------------
   */

  const filteredNodes =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return graph.nodes;
      }

      return graph.nodes.filter(
        (node) =>
          String(
            node.label || ""
          )
            .toLowerCase()
            .includes(query)
      );

    }, [graph.nodes, search]);


  const filteredNodeIds =
    useMemo(() => {

      return new Set(
        filteredNodes.map(
          (node) => node.id
        )
      );

    }, [filteredNodes]);


  const filteredEdges =
    useMemo(() => {

      if (!search.trim()) {
        return graph.edges;
      }

      return graph.edges.filter(
        (edge) =>
          filteredNodeIds.has(
            edge.source
          ) &&
          filteredNodeIds.has(
            edge.target
          )
      );

    }, [
      graph.edges,
      filteredNodeIds,
      search
    ]);


  /*
   * ------------------------------------------------------------
   * CYTOSCAPE ELEMENTS
   * ------------------------------------------------------------
   */

  const elements =
    useMemo(() => {

      const nodes =
        filteredNodes.map(
          (node) => ({
            data: {
              id: node.id,
              label: node.label,
              type: node.type
            }
          })
        );

      const edges =
        filteredEdges.map(
          (edge) => ({
            data: {
              id: edge.id,
              source: edge.source,
              target: edge.target,
              label:
                edge.relation || "related",
              weight:
                edge.weight || 1
            }
          })
        );

      return [
        ...nodes,
        ...edges
      ];

    }, [
      filteredNodes,
      filteredEdges
    ]);


  /*
   * ------------------------------------------------------------
   * CYTOSCAPE STYLE
   * ------------------------------------------------------------
   */

  const stylesheet = [

    {
      selector: "node",

      style: {
        label: "data(label)",

        "font-size": "8px",

        "text-wrap": "ellipsis",

        "text-max-width": "90px",

        "text-valign": "bottom",

        "text-margin-y": 7,

        "background-color": "#8b5cf6",

        width: 26,

        height: 26,

        "border-width": 2,

        "border-color": "#c4b5fd"
      }
    },


    {
      selector:
        'node[type="wallet"]',

      style: {
        "background-color":
          "#8b5cf6",

        "border-color":
          "#c4b5fd"
      }
    },


    {
      selector:
        'node[type="transaction"]',

      style: {
        "background-color":
          "#3b82f6",

        "border-color":
          "#93c5fd",

        width: 20,

        height: 20,

        label: "",

        "text-opacity": 0
      }
    },


    {
      selector:
        'node[type="ip"]',

      style: {
        "background-color":
          "#10b981",

        "border-color":
          "#6ee7b7",

        width: 22,

        height: 22,

        label: "",

        "text-opacity": 0
      }
    },


    {
      selector: "edge",

      style: {

        width: 1,

        "line-color":
          "#475569",

        "target-arrow-color":
          "#64748b",

        "target-arrow-shape":
          "triangle",

        "curve-style":
          "bezier",

        label:
          "data(label)",

        "font-size":
          "7px",

        color:
          "#94a3b8",

        "text-background-color":
          "#0b0d14",

        "text-background-opacity":
          0.8,

        "text-background-padding":
          "2px"
      }
    }
  ];


  /*
   * ------------------------------------------------------------
   * GRAPH LAYOUT
   * ------------------------------------------------------------
   */

  const layout = {

    name: "cose",

    animate: false,

    fit: true,

    padding: 70,

    nodeRepulsion: 14000,

    idealEdgeLength: 150,

    edgeElasticity: 100,

    nestingFactor: 1.2,

    gravity: 0.15,

    numIter: 800
  };


  /*
   * ------------------------------------------------------------
   * GRAPH SUMMARY
   * ------------------------------------------------------------
   */

  const summary =
    graph.summary || {};


  return (

    <div className="page">

      <section className="dashboard-hero">

        <div className="dashboard-hero-content">

          <div className="eyebrow">
            ENTITY CORRELATION
          </div>

          <h1>
            Transaction Graph
          </h1>

          <p>
            Investigate relationships between
            Bitcoin wallets, transactions and
            network IP observations.
          </p>

        </div>

      </section>


      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}


      {/* -------------------------------------------------------
          SUMMARY
      ------------------------------------------------------- */}

      <section className="dashboard-stats">

        <div className="glass-stat-card lavender">

          <div className="stat-icon">
            <Network size={21} />
          </div>

          <div className="stat-content">

            <span>
              Graph Nodes
            </span>

            <strong>
              {loading
                ? "…"
                : summary.nodes || 0}
            </strong>

          </div>

        </div>


        <div className="glass-stat-card blue">

          <div className="stat-icon">
            <ArrowRight size={21} />
          </div>

          <div className="stat-content">

            <span>
              Relationships
            </span>

            <strong>
              {loading
                ? "…"
                : summary.edges || 0}
            </strong>

          </div>

        </div>


        <div className="glass-stat-card mint">

          <div className="stat-icon">
            <Wallet size={21} />
          </div>

          <div className="stat-content">

            <span>
              Wallets
            </span>

            <strong>
              {loading
                ? "…"
                : summary.wallets || 0}
            </strong>

          </div>

        </div>


        <div className="glass-stat-card blue">

          <div className="stat-icon">
            <Activity size={21} />
          </div>

          <div className="stat-content">

            <span>
              Transactions
            </span>

            <strong>
              {loading
                ? "…"
                : summary.transactions || 0}
            </strong>

          </div>

        </div>


        <div className="glass-stat-card mint">

          <div className="stat-icon">
            <Globe size={21} />
          </div>

          <div className="stat-content">

            <span>
              IP Entities
            </span>

            <strong>
              {loading
                ? "…"
                : summary.ips || 0}
            </strong>

          </div>

        </div>

      </section>


      {/* -------------------------------------------------------
          CONTROLS
      ------------------------------------------------------- */}

      <section className="glass-panel">

        <div className="dashboard-search-panel">

          <Search size={20} />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search wallet, transaction or IP..."
          />

        </div>


        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginTop: "16px"
          }}
        >

          <button
            type="button"
            onClick={() =>
              setType("all")
            }
            className={
              type === "all"
                ? "dashboard-clickable-card"
                : ""
            }
          >
            All entities
          </button>


          <button
            type="button"
            onClick={() =>
              setType("wallet")
            }
            className={
              type === "wallet"
                ? "dashboard-clickable-card"
                : ""
            }
          >
            Wallets
          </button>


          <button
            type="button"
            onClick={() =>
              setType("transaction")
            }
            className={
              type === "transaction"
                ? "dashboard-clickable-card"
                : ""
            }
          >
            Transactions
          </button>


          <button
            type="button"
            onClick={() =>
              setType("ip")
            }
            className={
              type === "ip"
                ? "dashboard-clickable-card"
                : ""
            }
          >
            IPs
          </button>

        </div>

      </section>


      {/* -------------------------------------------------------
          GRAPH
      ------------------------------------------------------- */}

      <section className="glass-panel">

        <div className="wallet-directory-header">

          <div>

            <div className="eyebrow">
              LINK ANALYSIS
            </div>

            <h2>
              Entity relationships
            </h2>

          </div>

        </div>


        {loading ? (

          <div className="dashboard-empty-message">
            Loading investigation graph...
          </div>

        ) : elements.length === 0 ? (

          <div className="dashboard-empty-message">

            No graph relationships found.

            <br />

            Run the analysis pipeline after
            ingesting the dataset.

          </div>

        ) : (

          <div
            style={{
              height: "650px",
              width: "100%",
              marginTop: "20px",
              border:
                "1px solid rgba(148,163,184,0.15)",
              borderRadius: "14px",
              overflow: "hidden"
            }}
          >

            <CytoscapeComponent
              elements={elements}
              stylesheet={stylesheet}
              layout={layout}
              style={{
                width: "100%",
                height: "100%"
              }}
            />

          </div>

        )}

      </section>


      {/* -------------------------------------------------------
          LEGEND
      ------------------------------------------------------- */}

      <section className="glass-panel">

        <div className="eyebrow">
          GRAPH LEGEND
        </div>

        <div
          style={{
            display: "flex",
            gap: "30px",
            flexWrap: "wrap",
            marginTop: "15px"
          }}
        >

          <span>
            🟣 Wallet
          </span>

          <span>
            🔵 Transaction
          </span>

          <span>
            🟢 Network IP
          </span>

          <span>
            → Relationship
          </span>

        </div>

      </section>

    </div>
  );
}

export default Graph;