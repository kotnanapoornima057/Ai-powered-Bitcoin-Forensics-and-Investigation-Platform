import {
  useEffect,
  useState,
} from "react";

import client from "../api/client";

export function useWalletDetail(address) {
  const [wallet, setWallet] =
    useState(null);

  const [transactions, setTransactions] =
    useState([]);

  const [alerts, setAlerts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!address) return;

    let cancelled = false;

    async function loadWallet() {
      setLoading(true);
      setError("");

      try {
        const data =
          await client.get(
            `/wallets/${encodeURIComponent(address)}`
          );

        if (cancelled) return;

        setWallet(
          data.wallet || null
        );

        setTransactions(
          data.transactions || []
        );

        setAlerts(
          data.alerts || []
        );
      } catch (error) {
        if (!cancelled) {
          setError(
            error.message ||
            "Unable to load wallet."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWallet();

    return () => {
      cancelled = true;
    };
  }, [address]);

  const breakdown =
    (wallet?.explanation || [])
      .map((item) => ({
        name:
          item.label ||
          item.feature ||
          "Risk factor",

        value:
          Number(item.value || 0),

        points:
          Number(item.points || 0),

        percentile:
          item.percentile !== null &&
          item.percentile !== undefined
            ? Number(item.percentile)
            : null,

        description:
          item.description ||
          "Contribution to the wallet risk score."
      }));

  return {
    wallet,
    transactions,
    alerts,
    breakdown,
    loading,
    error,
  };
}