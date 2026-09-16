import { useRef, useState } from "react";

import {
  Upload,
  FileText,
  ShieldCheck,
  Lock,
  BrainCircuit,
  Database,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";

import client, { getToken } from "../api/client";

import useWalletsStore from "../store/walletsStore";

function Ingestion() {
  const fileInputRef = useRef(null);

  const setTransactions = useWalletsStore(
    (s) => s.setTransactions
  );

  const setWallets = useWalletsStore(
    (s) => s.setWallets
  );

  const setStats = useWalletsStore(
    (s) => s.setStats
  );

  const setAlerts = useWalletsStore(
    (s) => s.setAlerts
  );

  const setSelectedFile = useWalletsStore(
    (s) => s.setSelectedFile
  );

  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function upload(selected) {
    if (!selected) {
      return;
    }

    // -----------------------------------------
    // 1. Check file type
    // -----------------------------------------

    const extension = selected.name
      .toLowerCase()
      .split(".")
      .pop();

    if (!["csv", "json", "xml"].includes(extension)) {
      setError(
        "Only CSV, JSON and XML files are supported."
      );

      return;
    }

    // -----------------------------------------
    // 2. Check authentication BEFORE upload
    // -----------------------------------------

    const token = getToken();

    if (!token) {
      setError(
        "You are not authenticated. Please logout and login again."
      );

      return;
    }

    // -----------------------------------------
    // 3. Check file size
    // -----------------------------------------

    const maxSize =
      100 * 1024 * 1024;

    if (selected.size > maxSize) {
      setError(
        "File is larger than the 100 MB upload limit."
      );

      return;
    }

    // -----------------------------------------
    // 4. Store selected file
    // -----------------------------------------

    setFile(selected);

    setSelectedFile(selected);

    setError("");

    setProcessed(false);

    setResult(null);

    setProcessing(true);

    try {
      // -----------------------------------------
      // 5. Create multipart form
      // -----------------------------------------

      const formData = new FormData();

      formData.append(
        "file",
        selected
      );

      // -----------------------------------------
      // 6. Send to backend
      // -----------------------------------------

      const uploadData = await client.post(
        "/datasets/upload",
        formData
      );

      let data = uploadData;
      const datasetId = uploadData.dataset?.id;

      if (datasetId) {
        for (let attempt = 0; attempt < 600; attempt++) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000)
          );

          const statusResponse = await client.get(
            `/datasets/${datasetId}`
          );

          const status = statusResponse.dataset?.status;

          if (status === "failed") {
            throw new Error(
              statusResponse.dataset?.error_message ||
                "Dataset analysis failed."
            );
          }

          if (status === "completed") {
            data = {
              ...uploadData,
              dataset: statusResponse.dataset,
            };
            break;
          }

          if (attempt === 599) {
            throw new Error(
              "Dataset analysis is taking longer than expected."
            );
          }
        }
      }

      console.log(
        "Dataset upload response:",
        data
      );

      // -----------------------------------------
      // 7. Load the processed investigation data
      // -----------------------------------------

      const [
        walletsResponse,
        alertsResponse,
        transactionsResponse,
      ] = await Promise.all([
        client.get("/wallets"),
        client.get("/alerts"),
        client.get("/dashboard/transactions?limit=100"),
      ]);

      const wallets =
        walletsResponse.wallets || [];

      const alerts =
        alertsResponse.alerts || [];

      const transactions =
        transactionsResponse.transactions || [];

      // -----------------------------------------
      // 8. Update application store
      // -----------------------------------------

      setWallets(wallets);

      setAlerts(alerts);

      setTransactions(transactions);

      // -----------------------------------------
      // 9. Calculate dashboard statistics
      // -----------------------------------------

      const suspiciousWallets =
        wallets.filter(
          (wallet) =>
            Number(
              wallet.risk_score ??
              wallet.riskScore ??
              0
            ) >= 40
        ).length;

      const highRiskWallets =
        wallets.filter(
          (wallet) =>
            Number(
              wallet.risk_score ??
              wallet.riskScore ??
              0
            ) >= 80
        ).length;

      const totalVolume =
        wallets.reduce(
          (sum, wallet) =>
            sum +
            Number(
              wallet.total_input ??
              wallet.total_sent_btc ??
              0
            ) +
            Number(
              wallet.total_output ??
              wallet.total_received_btc ??
              0
            ),
          0
        );

      setStats({
        totalTransactions:
          data.dataset?.record_count ||
          transactions.length ||
          0,

        suspiciousWallets,

        highRiskWallets,

        totalVolume,
      });

      // -----------------------------------------
      // 10. Show success
      // -----------------------------------------

      setResult(data);

      setProcessed(true);

    } catch (err) {
      console.error(
        "Dataset upload failed:",
        err
      );

      const message =
        err?.message ||
        "Dataset upload failed.";

      if (
        message.toLowerCase().includes(
          "authentication"
        )
      ) {
        setError(
          "Authentication expired. Please logout and login again, then upload the dataset."
        );
      } else {
        setError(message);
      }

    } finally {
      setProcessing(false);
    }
  }

  function openFilePicker() {
    if (processing) {
      return;
    }

    fileInputRef.current?.click();
  }

  return (
    <div className="page">

      {/* -------------------------------- */}
      {/* HEADER */}
      {/* -------------------------------- */}

      <div className="dashboard-hero">

        <div>

          <div className="eyebrow">
            FORENSIC DATA PIPELINE
          </div>

          <h1>
            Dataset Ingestion
          </h1>

          <p>
            Upload Bitcoin blockchain and
            network metadata and run the
            complete offline forensic analysis
            pipeline.
          </p>

        </div>

      </div>

      {/* -------------------------------- */}
      {/* UPLOAD PANEL */}
      {/* -------------------------------- */}

      <section
        className="glass-panel"
        style={{
          padding: "28px",
        }}
      >

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json,.xml"
          hidden
          onChange={(event) => {
            const selected =
              event.target.files?.[0];

            upload(selected);

            // Allows selecting the same
            // file again after an error.
            event.target.value = "";
          }}
        />

        {/* -------------------------------- */}
        {/* DROP ZONE */}
        {/* -------------------------------- */}

        <div
          className="upload-dropzone"
          onClick={openFilePicker}
          style={{
            cursor: processing
              ? "not-allowed"
              : "pointer",

            padding: "48px",

            textAlign: "center",

            opacity: processing
              ? 0.7
              : 1,
          }}
        >

          <Upload
            size={42}
          />

          <h2>

            {processing
              ? "Running forensic analysis..."
              : "Upload Dataset"}

          </h2>

          <p>
            Upload CSV, JSON or XML
            evidence for offline forensic
            analysis.
          </p>

          <button
            type="button"
            className="primary-button"
            disabled={processing}
            onClick={(event) => {
              event.stopPropagation();

              openFilePicker();
            }}
          >

            {processing
              ? "Processing..."
              : "Upload CSV / JSON / XML"}

          </button>

        </div>

        {/* -------------------------------- */}
        {/* SELECTED FILE */}
        {/* -------------------------------- */}

        {file && (
          <div
            style={{
              marginTop: "18px",

              display: "flex",

              alignItems: "center",

              gap: "12px",

              padding: "14px 16px",

              borderRadius: "12px",

              background:
                "rgba(255,255,255,0.04)",
            }}
          >

            <FileText
              size={20}
            />

            <div
              style={{
                flex: 1,
              }}
            >

              <strong>
                {file.name}
              </strong>

              <div
                style={{
                  fontSize: "12px",

                  opacity: 0.6,

                  marginTop: "3px",
                }}
              >
                {(file.size / 1024 / 1024)
                  .toFixed(2)}{" "}
                MB
              </div>

            </div>

            {processed && (
              <CheckCircle2
                size={22}
              />
            )}

          </div>
        )}

        {/* -------------------------------- */}
        {/* ERROR */}
        {/* -------------------------------- */}

        {error && (
          <div
            className="auth-error"
            style={{
              marginTop: "18px",

              display: "flex",

              alignItems: "center",

              gap: "8px",
            }}
          >

            <XCircle
              size={18}
            />

            <span>
              {error}
            </span>

          </div>
        )}

        {/* -------------------------------- */}
        {/* PIPELINE CARDS */}
        {/* -------------------------------- */}

        <div
          className="wallet-stats"
          style={{
            marginTop: "24px",
          }}
        >

          <div className="wallet-stat-card">

            <Database
              size={20}
            />

            <div>

              <div className="wallet-stat-label">
                STORAGE
              </div>

              <div className="wallet-stat-value">
                PostgreSQL
              </div>

            </div>

          </div>

          <div className="wallet-stat-card">

            <BrainCircuit
              size={20}
            />

            <div>

              <div className="wallet-stat-label">
                ML MODEL
              </div>

              <div className="wallet-stat-value">
                Isolation Forest
              </div>

            </div>

          </div>

          <div className="wallet-stat-card">

            <ShieldCheck
              size={20}
            />

            <div>

              <div className="wallet-stat-label">
                CORRELATION
              </div>

              <div className="wallet-stat-value">
                IP ↔ Wallet ↔ TX
              </div>

            </div>

          </div>

          <div className="wallet-stat-card">

            <Lock
              size={20}
            />

            <div>

              <div className="wallet-stat-label">
                OUTPUT
              </div>

              <div className="wallet-stat-value">
                Risk + Alerts
              </div>

            </div>

          </div>

        </div>

        {/* -------------------------------- */}
        {/* SUCCESS */}
        {/* -------------------------------- */}

        {result?.analysis && (
          <div
            className="glass-panel"
            style={{
              marginTop: "20px",

              padding: "18px",
            }}
          >

            <div
              style={{
                display: "flex",

                alignItems: "center",

                gap: "8px",
              }}
            >

              <Zap
                size={18}
              />

              <strong>
                Analysis completed
              </strong>

            </div>

            <p>
              {result.dataset?.record_count ||
                0}{" "}
              records ingested and forensic
              wallet analysis completed.
            </p>

          </div>
        )}

      </section>

    </div>
  );
}

export default Ingestion;