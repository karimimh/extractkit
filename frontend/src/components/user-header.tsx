import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/auth-context";
import { AuthModal } from "./auth-modal";
import { PaymentModal } from "./payment-modal";
import { User } from "lucide-react";

export function UserHeader() {
  const { user, logout, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
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
      setPopoverPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setProfileOpen((v) => !v);
  };

  if (isLoading) return null;

  return (
    <>
      {/* Desktop: full inline controls */}
      <div className="user-header user-header--full">
        {user ? (
          <>
            <span className="user-email" title={user.email}>{user.email}</span>
            <span className="credit-badge" title="Download credits remaining">
              {user.download_credits} {user.download_credits === 1 ? "credit" : "credits"}
            </span>
            <button
              type="button"
              className="btn-buy"
              onClick={() => setShowPaymentModal(true)}
            >
              Buy Credits
            </button>
            <button type="button" className="btn-ghost" onClick={logout}>
              Sign Out
            </button>
          </>
        ) : (
          <button type="button" className="btn-primary" onClick={() => setShowAuthModal(true)}>
            Sign In
          </button>
        )}
      </div>

      {/* Mobile: profile circle + popover */}
      <div className="user-header--compact">
        <button
          ref={btnRef}
          type="button"
          className={`app-nav-profile-btn${user ? " signed-in" : ""}`}
          onClick={openProfile}
          aria-label="Account menu"
        >
          {user ? user.email.charAt(0).toUpperCase() : <User size={15} />}
        </button>
        {profileOpen && createPortal(
          <div
            id="profile-popover"
            className="app-nav-profile-popover"
            style={{ top: popoverPos.top, right: popoverPos.right }}
          >
            {user ? (
              <>
                <div className="popover-email">{user.email}</div>
                <div className="popover-credits">
                  <span className="credit-badge">
                    {user.download_credits} {user.download_credits === 1 ? "credit" : "credits"}
                  </span>
                </div>
                <div className="popover-actions">
                  <button
                    type="button"
                    className="btn-buy"
                    onClick={() => { setShowPaymentModal(true); setProfileOpen(false); }}
                  >
                    Buy Credits
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => { logout(); setProfileOpen(false); }}
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="popover-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => { setShowAuthModal(true); setProfileOpen(false); }}
                >
                  Sign In
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showPaymentModal && (
        <PaymentModal onClose={() => setShowPaymentModal(false)} />
      )}
    </>
  );
}
