import { useEffect, useState } from "react";
import client from "../api/client";

export function useWalletGraph(address) {
  const [graph, setGraph] = useState({
    nodes: [],
    edges: [],
    summary: {
      nodes: 0,
      edges: 0,
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!address) {
      return;
    }

    let cancelled = false;

    async function loadGraph() {
      setLoading(true);
      setError("");

      try {
        const response = await client.get(
          `/graph/wallet/${encodeURIComponent(address)}`
        );

        if (cancelled) {
          return;
        }

        setGraph({
          nodes: response.nodes || [],
          edges: response.edges || [],
          summary: response.summary || {
            nodes: 0,
            edges: 0,
          },
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Wallet graph loading error:",
          error
        );

        setError(
          error.message ||
            "Unable to load wallet graph."
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
  }, [address]);

  return {
    graph,
    loading,
    error,
  };
}