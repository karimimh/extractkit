export interface SubscriptionStatus {
  username: string;
  email: string;
  tier: "free" | "pro";
  is_pro: boolean;
  subscription_active: boolean;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  payment_method: string;
  last_payment_date: string | null;
  max_notes: number | null;
  max_characters: number | null;
  max_storage_bytes: number | null;
  has_ai_access: boolean;
  current_note_count?: number;
  current_storage_bytes?: number;
  current_storage_mb?: number;
  days_remaining?: number;
}

export interface Payment {
  id: number;
  payment_id: string;
  amount_usd: string;
  cryptocurrency: string;
  crypto_amount: string;
  status: "pending" | "confirming" | "confirmed" | "failed" | "expired";
  subscription_type: "monthly" | "annual" | "lifetime";
  payment_url: string;
  created_at: string;
  confirmed_at: string | null;
  expires_at: string | null;
}

export interface CreatePaymentData {
  subscription_type: "monthly" | "annual" | "lifetime";
  cryptocurrency?: string;
}
