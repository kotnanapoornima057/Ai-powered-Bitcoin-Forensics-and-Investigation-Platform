import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Ingestion from "./pages/Ingestion";
import Alerts from "./pages/Alerts";
import AlertDetail from "./pages/AlertDetail";
import Wallets from "./pages/Wallets";
import WalletDetail from "./pages/WalletDetail";
import Entities from "./pages/Entities";
import Graph from "./pages/Graph";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";


function PlaceholderPage({
  title,
  description,
}) {
  return (
    <div className="page">

      <div className="eyebrow">
        BITCOIN FORENSICS
      </div>

      <h1>
        {title}
      </h1>

      <p>
        {description}
      </p>

    </div>
  );
}


function App() {
  return (
    <AuthProvider>

      <Routes>

        {/* AUTH */}

        <Route
          path="/login"
          element={
            <Login />
          }
        />

        <Route
          path="/register"
          element={
            <Register />
          }
        />


        {/* PROTECTED APPLICATION */}

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >

          <Route
            path="/dashboard"
            element={
              <Dashboard />
            }
          />

          <Route
            path="/ingestion"
            element={
              <Ingestion />
            }
          />

          <Route
            path="/alerts"
            element={
              <Alerts />
            }
          />

          <Route
            path="/alert/:id"
            element={
              <AlertDetail />
            }
          />

          <Route
            path="/wallets"
            element={
              <Wallets />
            }
          />

          <Route
            path="/wallet/:address"
            element={
              <WalletDetail />
            }
          />

          {/* ENTITY INVESTIGATION */}

          <Route
            path="/entities"
            element={
              <Entities />
            }
          />

          {/* TRANSACTION GRAPH */}

          <Route
            path="/graph"
            element={
              <Graph />
            }
          />

          {/* REPORTS */}

          <Route
            path="/reports"
            element={
              <Reports />
            }
          />

          {/* SETTINGS */}

          <Route
            path="/settings"
            element={
              <Settings />
            }
          />

        </Route>


        {/* DEFAULT ROUTES */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </AuthProvider>
  );
}


export default App;