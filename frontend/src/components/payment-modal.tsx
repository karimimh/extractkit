import { useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/auth-context";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const PACKAGES = [
  { id: 1, downloads: 10,    price: 2 },
  { id: 2, downloads: 25,    price: 5 },
  { id: 3, downloads: 50,    price: 10 },
  { id: 4, downloads: 100,   price: 20 },
  { id: 5, downloads: 500,   price: 100 },
  { id: 6, downloads: 1000,  price: 200 },
  { id: 7, downloads: 10000, price: 2000 },
] as const;

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

  // When user navigates back to the page, refresh credits
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
          <h2>Buy Download Credits</h2>
          <p className="modal-subtitle">Pay with crypto · Credits never expire</p>
        </div>

        {error && <p className="message error">{error}</p>}

        <div className="packages-grid">
          {PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              className="package-card"
              onClick={() => handleSelect(pkg.id)}
              disabled={loadingId !== null}
            >
              <span className="package-downloads">{pkg.downloads.toLocaleString()}</span>
              <span className="package-unit">downloads</span>
              <span className="package-price">${pkg.price}</span>
              {loadingId === pkg.id && <span className="package-spinner" />}
            </button>
          ))}
        </div>

        <p className="modal-footnote">
          You will be redirected to NOWPayments to complete the purchase.
          Credits are added automatically after payment confirmation.
        </p>
      </div>
    </div>,
    document.body
  );
}
