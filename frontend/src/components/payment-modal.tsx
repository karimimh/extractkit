import { useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/auth-context";
import { formatUsd, WALLET_PACKAGES } from "../lib/billing";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

type Props = {
  onClose: () => void;
};

export function PaymentModal({ onClose }: Props) {
  const { token, refreshUser } = useAuth();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (packageId: number) => {
    if (!token) return;
    setError(null);
    setLoadingId(packageId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ package_id: packageId }),
      });
      const data = (await res.json()) as { invoice_url?: string; detail?: string };
      if (!res.ok) {
        setError(data.detail ?? "Failed to create payment.");
        return;
      }
      // Redirect to NOWPayments checkout
      window.location.href = data.invoice_url!;
    } catch {
      setError("Unable to reach server.");
    } finally {
      setLoadingId(null);
    }
  };

  // When user navigates back to the page, refresh wallet balance
  const handleClose = async () => {
    await refreshUser();
    onClose();
  };

  return createPortal(
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={handleClose} aria-label="Close">
          ✕
        </button>

        <div className="modal-header">
          <h2>Add Funds</h2>
          <p className="modal-subtitle">Pay with crypto · Prepaid wallet balance</p>
        </div>

        {error && <p className="message error">{error}</p>}

        <div className="packages-grid">
          {WALLET_PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              className="package-card"
              onClick={() => handleSelect(pkg.id)}
              disabled={loadingId !== null}
            >
              <span className="package-downloads">{formatUsd(pkg.balanceCents)}</span>
              <span className="package-unit">wallet balance</span>
              <span className="package-price">${pkg.priceUsd}</span>
              {loadingId === pkg.id && <span className="package-spinner" />}
            </button>
          ))}
        </div>

        <p className="modal-footnote">
          You will be redirected to NOWPayments to complete the purchase.
          Funds are added automatically after payment confirmation.
        </p>
      </div>
    </div>,
    document.body
  );
}
