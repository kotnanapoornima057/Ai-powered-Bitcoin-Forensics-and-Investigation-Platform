import {
  LayoutDashboard,
  Bell,
  Search,
  Shield,
  Network
} from "lucide-react";

import {
  NavLink
} from "react-router-dom";

const links = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard
  },

  {
    name: "Alerts",
    path: "/alerts",
    icon: Bell
  }
];

function Sidebar() {

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-gray-950 border-r border-gray-800 z-40">

      <div className="h-full flex flex-col">

        {/* Logo */}

        <div className="px-6 py-6 border-b border-gray-800">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">

              <Shield
                size={22}
                className="text-black"
              />

            </div>

            <div>

              <h1 className="font-bold text-lg">
                Bitcoin
              </h1>

              <p className="text-xs text-orange-400">
                FORENSICS
              </p>

            </div>

          </div>

        </div>

        {/* Navigation */}

        <nav className="p-4 space-y-2">

          {links.map((link) => {

            const Icon = link.icon;

            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === "/"}
                className={({ isActive }) =>
                  `
                  flex items-center gap-3
                  px-4 py-3
                  rounded-lg
                  text-sm
                  transition
                  ${
                    isActive
                      ? "bg-orange-500 text-black font-semibold"
                      : "text-gray-400 hover:bg-gray-900 hover:text-white"
                  }
                  `
                }
              >

                <Icon size={18} />

                {link.name}

              </NavLink>
            );

          })}

        </nav>

        {/* Bottom */}

        <div className="mt-auto p-4">

          <div className="bg-gray-900 rounded-lg p-4">

            <div className="flex items-center gap-2 text-green-400 text-xs">

              <span className="w-2 h-2 bg-green-400 rounded-full" />

              System Online

            </div>

            <p className="text-xs text-gray-500 mt-2">

              Bitcoin investigation engine

            </p>

          </div>

        </div>

      </div>

    </aside>
  );
}

export default Sidebar;