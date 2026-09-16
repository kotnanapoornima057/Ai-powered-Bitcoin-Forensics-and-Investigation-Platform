import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  Bell,
  Network,
  FileText,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";

import { useAuth } from "../../auth/AuthContext";

function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-layout">

      {/* =====================================================
          SIDEBAR
          ===================================================== */}
      <aside className="sidebar">

        {/* ===================================================
            SIDEBAR BRAND
            =================================================== */}
        <div className="sidebar-brand">

          <div className="sidebar-bitcoin-icon">
            ₿
          </div>

          <div>
            <div className="sidebar-brand-title">
              INVESTIGATION
            </div>

            <div className="sidebar-brand-subtitle">
              CONSOLE
            </div>
          </div>

        </div>


        {/* ===================================================
            OFFLINE STATUS
            =================================================== */}
        <div className="sidebar-offline">

          <div className="sidebar-status-dot"></div>

          <div>
            <strong>
              OFFLINE ANALYSIS
            </strong>

            <small>
              Local investigation mode
            </small>
          </div>

        </div>


        {/* ===================================================
            NAVIGATION
            =================================================== */}
        <nav className="sidebar-nav">

          {/* INVESTIGATION */}
          <div className="sidebar-section-title">
            INVESTIGATION
          </div>


          {/* DASHBOARD */}
          <a
            href="/dashboard"
            className={`sidebar-link ${
              location.pathname === "/dashboard"
                ? "active"
                : ""
            }`}
          >
            <LayoutDashboard size={18} />

            <span>
              Dashboard
            </span>
          </a>


          {/* DATA INGESTION */}
          <a
            href="/ingestion"
            className={`sidebar-link ${
              location.pathname === "/ingestion"
                ? "active"
                : ""
            }`}
          >
            <Database size={18} />

            <span>
              Data Ingestion
            </span>
          </a>


          {/* ALERTS */}
          <a
            href="/alerts"
            className={`sidebar-link ${
              location.pathname.startsWith("/alerts") ||
              location.pathname.startsWith("/alert/")
                ? "active"
                : ""
            }`}
          >
            <Bell size={18} />

            <span>
              Alerts
            </span>
          </a>


          {/* =================================================
              WALLET LINK INTENTIONALLY REMOVED

              Wallets are accessed by clicking
              "Unique Wallets" from the Dashboard.
          ================================================= */}


          {/* ENTITIES */}
          <a
            href="/entities"
            className={`sidebar-link ${
              location.pathname === "/entities"
                ? "active"
                : ""
            }`}
          >
            <Network size={18} />

            <span>
              Entities
            </span>
          </a>


          {/* TRANSACTION GRAPH */}
          <a
            href="/graph"
            className={`sidebar-link ${
              location.pathname === "/graph"
                ? "active"
                : ""
            }`}
          >
            <Network size={18} />

            <span>
              Transaction Graph
            </span>
          </a>


          {/* =================================================
              SYSTEM
          ================================================= */}
          <div className="sidebar-section-title sidebar-system-title">
            SYSTEM
          </div>


          {/* REPORTS */}
          <a
            href="/reports"
            className={`sidebar-link ${
              location.pathname === "/reports"
                ? "active"
                : ""
            }`}
          >
            <FileText size={18} />

            <span>
              Reports
            </span>
          </a>


          {/* SETTINGS */}
          <a
            href="/settings"
            className={`sidebar-link ${
              location.pathname === "/settings"
                ? "active"
                : ""
            }`}
          >
            <Settings size={18} />

            <span>
              Settings
            </span>
          </a>

        </nav>


        {/* ===================================================
            SIDEBAR BOTTOM
            =================================================== */}
        <div className="sidebar-bottom">

          <div className="sidebar-security">

            <Shield size={16} />

            <div>
              <strong>
                SECURE ANALYSIS
              </strong>

              <small>
                Metadata remains local
              </small>
            </div>

          </div>

        </div>

      </aside>


      {/* =====================================================
          RIGHT SIDE OF SIDEBAR
          ===================================================== */}
      <div className="main-content">


        {/* ===================================================
            TOP BAR
            =================================================== */}
        <header className="app-topbar">

          <div className="app-topbar-title">
            Investigation Console
          </div>


          {/* LOGOUT */}
          <button
            type="button"
            className="topbar-logout"
            onClick={handleLogout}
          >
            <LogOut size={17} />

            <span>
              Logout
            </span>
          </button>

        </header>


        {/* ===================================================
            PAGE CONTENT
            =================================================== */}
        <main className="app-content">

          <Outlet />

        </main>

      </div>

    </div>
  );
}

export default AppLayout;