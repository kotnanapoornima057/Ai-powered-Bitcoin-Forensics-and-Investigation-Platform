import {
  useRef,
  useState
} from "react";

import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle2
} from "lucide-react";

import client from "../../api/client";

function CsvUploadZone({
  onComplete
}) {
  const inputRef =
    useRef(null);

  const [file, setFile] =
    useState(null);

  const [dragging, setDragging] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState(null);

  function selectFile(
    selectedFile
  ) {
    if (!selectedFile) {
      return;
    }

    const extension =
      selectedFile.name
        .toLowerCase()
        .split(".")
        .pop();

    if (
      !["csv", "json", "xml"]
        .includes(extension)
    ) {
      setError(
        "Only CSV, JSON and XML files are supported."
      );

      return;
    }

    setFile(
      selectedFile
    );

    setError("");

    setResult(null);
  }

  function handleDrop(event) {
    event.preventDefault();

    setDragging(false);

    selectFile(
      event.dataTransfer
        .files?.[0]
    );
  }

  async function upload() {
    if (!file) {
      setError(
        "Please select a dataset first."
      );

      return;
    }

    setLoading(true);

    setError("");

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await client.post(
          "/datasets/upload",
          formData
        );

      setResult(
        response
      );

      if (onComplete) {
        onComplete(
          response
        );
      }
    } catch (error) {
      setError(
        error.message ||
          "Dataset upload failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel">
      <div className="wallet-directory-header">
        <div>
          <div className="eyebrow">
            FORENSIC DATA PIPELINE
          </div>

          <h2>
            Upload Dataset
          </h2>

          <p>
            Upload CSV, JSON or XML
            evidence for offline
            forensic analysis.
          </p>
        </div>

        <FileText
          size={28}
        />
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}

        onDragLeave={() =>
          setDragging(false)
        }

        onDrop={
          handleDrop
        }

        onClick={() =>
          inputRef.current?.click()
        }

        className={
          `upload-dropzone ${
            dragging
              ? "upload-dropzone-active"
              : ""
          }`
        }
      >
        {loading ? (
          <Loader2
            size={42}
            className="spin"
          />
        ) : (
          <Upload
            size={42}
          />
        )}

        <h3>
          {loading
            ? "Processing dataset..."
            : "Drop your dataset here"}
        </h3>

        <p>
          or click to browse
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.json,.xml"
          hidden
          onChange={(event) =>
            selectFile(
              event.target.files?.[0]
            )
          }
        />
      </div>

      {file && (
        <div className="upload-file-row">
          <div className="upload-file-info">
            <FileText
              size={20}
            />

            <div>
              <strong>
                {file.name}
              </strong>

              <small>
                {(
                  file.size /
                  (1024 * 1024)
                ).toFixed(2)}
                {" MB"}
              </small>
            </div>
          </div>

          {!loading && (
            <button
              type="button"
              onClick={() =>
                setFile(null)
              }
            >
              <X size={18} />
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}

      <button
        type="button"
        className="primary-button"
        disabled={
          !file || loading
        }
        onClick={(event) => {
          event.stopPropagation();
          upload();
        }}
      >
        {loading
          ? "Running forensic analysis..."
          : "Upload & Analyze"}
      </button>

      {result && (
        <div className="upload-success">
          <CheckCircle2
            size={20}
          />

          <div>
            <strong>
              Analysis completed
            </strong>

            <p>
              {
                result.dataset
                  ?.record_count
              }{" "}
              records processed.
            </p>

            <p>
              {
                result.analysis
                  ?.walletsAnalyzed
              }{" "}
              wallets analyzed and{" "}
              {
                result.analysis
                  ?.alertsGenerated
              }{" "}
              alerts generated.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CsvUploadZone;