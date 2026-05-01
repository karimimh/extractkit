import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { AuthModal } from "./AuthModal";
import { PaymentModal } from "./PaymentModal";

export function UserHeader() {
  const { user, logout, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (isLoading) return null;

  return (
    <>
      <div className="user-header">
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

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showPaymentModal && (
        <PaymentModal onClose={() => setShowPaymentModal(false)} />
      )}
    </>
  );
}
