import {
  useCallback,
  useEffect,
  useState,
} from "react";

import client from "../api/client";

export function useAlerts(severity = "") {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = severity
        ? `?severity=${encodeURIComponent(
            severity
          )}`
        : "";

      const data = await client.get(
        `/alerts${query}`
      );

      setAlerts(data.alerts || []);
    } catch (error) {
      setError(
        error.message ||
          "Unable to load alerts."
      );
    } finally {
      setLoading(false);
    }
  }, [severity]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    alerts,
    loading,
    error,
    refresh,
  };
}