import { LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

function Settings() {
  const { user } = useAuth();

  return (
    <div className="page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <div className="eyebrow">SYSTEM SETTINGS</div>
          <h1>Investigator Profile</h1>
          <p>Manage your local investigation identity and review platform security status.</p>
        </div>
        <UserRound size={28} />
      </section>

      <div className="settings-grid">
        <section className="glass-panel settings-profile-panel">
          <div className="panel-title-row">
            <div>
              <div className="eyebrow">PROFILE</div>
              <h2>Account information</h2>
            </div>
            <UserRound size={20} />
          </div>

          <div className="settings-profile-header">
            <div className="settings-avatar">
              {(user?.name || "I").charAt(0).toUpperCase()}
            </div>
            <div>
              <h3>{user?.name || "Investigator"}</h3>
              <p>{user?.email || "No email available"}</p>
            </div>
          </div>

          <dl className="settings-details">
            <div>
              <dt>Full name</dt>
              <dd>{user?.name || "-"}</dd>
            </div>
            <div>
              <dt>Email address</dt>
              <dd>{user?.email || "-"}</dd>
            </div>
            <div>
              <dt>Account ID</dt>
              <dd>{user?.id || "-"}</dd>
            </div>
          </dl>
        </section>

        <section className="glass-panel">
          <div className="panel-title-row">
            <div>
              <div className="eyebrow">SECURITY</div>
              <h2>Local protection</h2>
            </div>
            <ShieldCheck size={20} />
          </div>

          <div className="settings-status-list">
            <div className="settings-status-item">
              <LockKeyhole size={18} />
              <div>
                <strong>JWT session active</strong>
                <span>Your authenticated session protects API access.</span>
              </div>
            </div>
            <div className="settings-status-item">
              <ShieldCheck size={18} />
              <div>
                <strong>Offline analysis enabled</strong>
                <span>Uploaded forensic metadata remains in the local database.</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Settings;
