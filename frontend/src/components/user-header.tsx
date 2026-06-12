import { ChevronDown, History, LogOut, User, WalletCards } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/auth-context";
import { formatUsd } from "../lib/billing";
import { listExportJobs } from "../lib/export-jobs";
import { AuthModal } from "./auth-modal";
import { ExportActivity } from "./export-activity";
import { PaymentModal } from "./payment-modal";

export function UserHeader() {
  const { user, token, logout, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExportHistory, setShowExportHistory] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, right: 0 });
  const [runningExports, setRunningExports] = useState(0);
  const btnRef = useRef<HTMLButtonElement>(null);

  const loadRunningExports = useCallback(async () => {
    if (!token) return setRunningExports(0);
    try {
      const jobs = await listExportJobs(token);
      setRunningExports(jobs.filter((job) => job.status === "pending" || job.status === "running").length);
    } catch {
      // The badge is supplementary; export errors remain visible on the history page.
    }
  }, [token]);

  useEffect(() => {
    const initial = window.setTimeout(() => void loadRunningExports(), 0);
    const update = () => void loadRunningExports();
    const interval = window.setInterval(update, 2500);
    window.addEventListener("export-job-updated", update);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
      window.removeEventListener("export-job-updated", update);
    };
  }, [loadRunningExports]);

  useEffect(() => {
    if (!profileOpen) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        btnRef.current && !btnRef.current.contains(target) &&
        !document.getElementById("profile-popover")?.contains(target)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [profileOpen]);

  const openProfile = () => {
    if (!profileOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPopoverPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setProfileOpen((value) => !value);
  };

  if (isLoading) return null;

  return (
    <>
      <div className="user-header">
        <button
          ref={btnRef}
          type="button"
          className={`app-nav-account-btn${user ? " signed-in" : ""}`}
          onClick={openProfile}
          aria-label="Account menu"
          aria-expanded={profileOpen}
        >
          <span className="app-nav-account-avatar">{user ? user.email.charAt(0).toUpperCase() : <User size={15} />}</span>
          <span className="app-nav-account-label">{user ? formatUsd(user.balance_cents) : "Sign in"}</span>
          <ChevronDown size={14} />
          {runningExports > 0 && (
            <span className="app-nav-running-badge" title={`${runningExports} export${runningExports === 1 ? "" : "s"} running`}>
              {runningExports}
            </span>
          )}
        </button>
        {profileOpen && createPortal(
          <div id="profile-popover" className="app-nav-profile-popover" style={{ top: popoverPos.top, right: popoverPos.right }}>
            {user ? (
              <>
                <div className="popover-email">{user.email}</div>
                <div className="popover-credits">
                  <span className="credit-badge">{formatUsd(user.balance_cents)} balance</span>
                </div>
                <div className="popover-actions">
                  <button type="button" className="btn-buy" onClick={() => { setShowPaymentModal(true); setProfileOpen(false); }}>
                    <WalletCards size={15} /> Add Funds
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => { setShowExportHistory(true); setProfileOpen(false); }}>
                    <History size={15} /> Export History
                    {runningExports > 0 && <span className="popover-running-count">{runningExports} running</span>}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => { logout(); setProfileOpen(false); }}>
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="popover-actions">
                <button type="button" className="btn-primary" onClick={() => { setShowAuthModal(true); setProfileOpen(false); }}>
                  Sign In
                </button>
              </div>
            )}
          </div>,
          document.body,
        )}
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      <PaymentModal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} />
      <ExportActivity dialog open={showExportHistory} onClose={() => setShowExportHistory(false)} />
    </>
  );
}
