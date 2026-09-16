import {
  Bell,
  Search
} from "lucide-react";

import {
  Link,
  useNavigate
} from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useState } from "react";

function Topbar() {

  const [search, setSearch] =
    useState("");

  const navigate =
    useNavigate();
const { user, logout } = useAuth();
  function handleSubmit(e) {

    e.preventDefault();

    const value =
      search.trim();

    if (!value) {
      return;
    }

    navigate(
      `/wallet/${encodeURIComponent(value)}`
    );

    setSearch("");
  }

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-gray-950/95 backdrop-blur border-b border-gray-800 z-30">

      <div className="h-full px-6 flex items-center justify-between">

        <form
          onSubmit={handleSubmit}
          className="relative w-[420px]"
        >

          <Search
            size={17}
            className="absolute left-3 top-3 text-gray-500"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search wallet address..."
            className="
              w-full
              bg-gray-900
              border border-gray-800
              rounded-lg
              pl-10 pr-4 py-2
              text-sm
              text-white
              outline-none
              focus:border-orange-500
            "
          />

        </form>

        <div className="flex items-center gap-5">

          <Link
            to="/alerts"
            className="relative text-gray-400 hover:text-white"
          >

            <Bell size={20} />

          </Link>

          <div className="flex items-center gap-3">

            <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold">

              BF

            </div>

            <div className="hidden md:block">

              <p className="text-sm font-medium">
                Investigator
              </p>

              <p className="text-xs text-gray-500">
                Analyst
              </p>

            </div>

          </div>

        </div>

      </div>

    </header>
  );
}

export default Topbar;