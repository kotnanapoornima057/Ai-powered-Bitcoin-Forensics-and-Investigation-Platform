import {
  Eye,
  ShieldAlert
} from "lucide-react";

import {
  useNavigate
} from "react-router-dom";

import RiskBadge from "../common/RiskBadge";

function SuspiciousWalletsTable({
  wallets = []
}) {

  const navigate =
    useNavigate();

  if (!wallets.length) {

    return (
      <div className="card p-10 text-center">

        <ShieldAlert
          size={35}
          className="mx-auto text-gray-600"
        />

        <p className="text-gray-400 mt-4">
          No suspicious wallets found yet.
        </p>

        <p className="text-sm text-gray-600 mt-1">
          Upload a transaction CSV to begin analysis.
        </p>

      </div>
    );

  }

  return (
    <div className="card overflow-hidden">

      <div className="px-5 py-4 border-b border-gray-800">

        <h2 className="font-semibold">
          Suspicious Wallets
        </h2>

        <p className="text-xs text-gray-500 mt-1">
          Ranked by calculated risk score
        </p>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-900">

            <tr className="text-left text-gray-500">

              <th className="px-5 py-3">
                Wallet Address
              </th>

              <th className="px-5 py-3">
                Risk
              </th>

              <th className="px-5 py-3">
                Score
              </th>

              <th className="px-5 py-3">
                Transactions
              </th>

              <th className="px-5 py-3">
                Volume
              </th>

              <th className="px-5 py-3">
                Flags
              </th>

              <th className="px-5 py-3">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {wallets.map((wallet) => (

              <tr
                key={wallet.address}
                className="border-t border-gray-800 hover:bg-gray-900/70"
              >

                <td className="px-5 py-4">

                  <button
                    onClick={() =>
                      navigate(
                        `/wallet/${encodeURIComponent(wallet.address)}`
                      )
                    }
                    className="
                      text-orange-400
                      hover:text-orange-300
                      wallet-address
                      text-left
                    "
                  >
                    {wallet.address}
                  </button>

                </td>

                <td className="px-5 py-4">

                  <RiskBadge
                    score={wallet.riskScore}
                  />

                </td>

                <td className="px-5 py-4 font-mono">

                  {(
                    wallet.riskScore * 100
                  ).toFixed(1)}

                </td>

                <td className="px-5 py-4">

                  {wallet.transactionCount}

                </td>

                <td className="px-5 py-4">

                  {wallet.volume.toFixed(4)} BTC

                </td>

                <td className="px-5 py-4">

                  <div className="flex gap-1 flex-wrap">

                    {wallet.flags
                      .slice(0, 3)
                      .map((flag) => (

                        <span
                          key={flag}
                          className="
                            px-2 py-1
                            rounded
                            bg-gray-800
                            text-xs
                            text-gray-400
                          "
                        >
                          {flag}
                        </span>

                      ))}

                  </div>

                </td>

                <td className="px-5 py-4">

                  <button
                    onClick={() =>
                      navigate(
                        `/wallet/${encodeURIComponent(wallet.address)}`
                      )
                    }
                    className="
                      p-2
                      rounded-lg
                      bg-gray-800
                      hover:bg-orange-500
                      hover:text-black
                    "
                  >

                    <Eye size={16} />

                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default SuspiciousWalletsTable;