import {
  useState,
} from "react";

import client from "../api/client";

export function useUploadCsv() {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function uploadDataset(file) {
    setLoading(true);
    setError("");

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const result =
        await client.post(
          "/datasets/upload",
          formData
        );

      return result;
    } catch (error) {
      const message =
        error.message ||
        "Dataset upload failed.";

      setError(message);

      throw error;
    } finally {
      setLoading(false);
    }
  }

  return {
    uploadDataset,
    loading,
    error,
  };
}