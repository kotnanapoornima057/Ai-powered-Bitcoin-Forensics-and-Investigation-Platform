import {
  Download
} from "lucide-react";

function escapeCsv(value) {

  if (value === null || value === undefined) {
    return "";
  }

  const stringValue =
    String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {

    return `"${stringValue.replaceAll('"', '""')}"`;

  }

  return stringValue;
}

function DownloadCsvButton({
  data = [],
  filename = "bitcoin-forensics.csv",
  label = "Download CSV"
}) {

  function download() {

    if (!data.length) {

      window.alert(
        "There is no data available to download."
      );

      return;
    }

    const columns =
      Object.keys(data[0]);

    const csv = [

      columns.join(","),

      ...data.map((row) =>
        columns
          .map((column) =>
            escapeCsv(row[column])
          )
          .join(",")
      )

    ].join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type: "text/csv;charset=utf-8;"
        }
      );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      filename;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      className="
        flex items-center gap-2
        px-4 py-2
        rounded-lg
        bg-gray-800
        border border-gray-700
        hover:bg-gray-700
        text-sm
        transition
      "
    >

      <Download size={16} />

      {label}

    </button>
  );
}

export default DownloadCsvButton;