import React from "react";
import CytoscapeComponent from "react-cytoscapejs";

function GraphCanvas({ elements = [], height = 500 }) {
  const stylesheet = [
    {
      selector: "node",
      style: {
        label: "data(label)",
        "background-color": "data(color)",
        color: "#ffffff",
        "font-size": "10px",
        "text-valign": "center",
        "text-halign": "center",
        width: 35,
        height: 35,
        "border-width": 1,
        "border-color": "#ffffff",
      },
    },
    {
      selector: "edge",
      style: {
        width: 2,
        "line-color": "#4b5563",
        "target-arrow-color": "#6b7280",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
      },
    },
    {
      selector: ".selected",
      style: {
        "border-width": 3,
        "border-color": "#f97316",
      },
    },
  ];

  return (
    <div
      className="bg-gray-950 rounded-lg overflow-hidden"
      style={{
        width: "100%",
        height: `${height}px`,
      }}
    >
      <CytoscapeComponent
        elements={elements}
        stylesheet={stylesheet}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
        layout={{
          name: "cose",
          animate: false,
          padding: 30,
          fit: true,
        }}
      />
    </div>
  );
}

export default GraphCanvas;