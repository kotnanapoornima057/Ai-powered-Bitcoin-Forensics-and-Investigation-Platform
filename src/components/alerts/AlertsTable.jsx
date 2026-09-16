import {
  useNavigate
} from "react-router-dom";

import RiskBadge from "../common/RiskBadge";

function AlertsTable({
  alerts = []
}) {

  const navigate =
    useNavigate();

  return (
    <div className="card overflow-hidden">

      <table className="w-full text-sm">

        <thead className="bg-gray-900">

          <tr className="text-left text-gray-500">

            <th className="px-5 py-4">
              Wallet
            </th>

            <th className="px-5 py-4">
              Risk
            </th>

            <th className="px-5 py-4">
              Reason
            </th>

            <th className="px-5 py-4">
              Status
            </th>

            <th className="px-5 py-4">
              Action
            </th>

          </tr>

        </thead>

        <tbody>

          {alerts.map((alert) => (

            <tr
              key={alert.id}
              className="border-t border-gray-800 hover:bg-gray-900/60"
            >

              <td className="px-5 py-4 wallet-address">

                {alert.wallet}

              </td>

              <td className="px-5 py-4">

                <RiskBadge
                  score={alert.riskScore}
                />

              </td>

              <td className="px-5 py-4 text-gray-400">

                {alert.reason}

              </td>

              <td className="px-5 py-4">

                <span
                  className="
                    px-2 py-1
                    rounded
                    bg-red-500/10
                    text-red-400
                    text-xs
                  "
                >
                  {alert.status}
                </span>

              </td>

              <td className="px-5 py-4">

                <button
                  onClick={() =>
                    navigate(
                      `/alerts/${alert.id}`
                    )
                  }
                  className="
                    px-3 py-1.5
                    bg-gray-800
                    hover:bg-gray-700
                    rounded-lg
                    text-xs
                  "
                >
                  View
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

      {!alerts.length && (

        <div className="p-10 text-center text-gray-500">

          No alerts available.

        </div>

      )}

    </div>
  );
}

export default AlertsTable;