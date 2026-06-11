export const PRICE_PER_ACTION_CENTS = 20;

export const WALLET_PACKAGES = [
  { id: 1, balanceCents: 500, priceUsd: 5 },
  { id: 2, balanceCents: 1000, priceUsd: 10 },
  { id: 3, balanceCents: 2500, priceUsd: 25 },
  { id: 4, balanceCents: 5000, priceUsd: 50 },
  { id: 5, balanceCents: 10000, priceUsd: 100 },
  { id: 6, balanceCents: 25000, priceUsd: 250 },
] as const;

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
