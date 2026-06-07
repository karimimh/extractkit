import type {
  SubscriptionStatus,
  Payment,
  CreatePaymentData,
} from "../../types/subscription-types";
import { ApiClient } from "./client";

const FREE_TIER: SubscriptionStatus = {
  username: "",
  email: "",
  tier: "free",
  is_pro: false,
  subscription_active: false,
  subscription_start_date: null,
  subscription_end_date: null,
  payment_method: "",
  last_payment_date: null,
  max_notes: null,
  max_characters: null,
  max_storage_bytes: null,
  has_ai_access: true,
};

export class SubscriptionApiClient extends ApiClient {
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    return { ...FREE_TIER };
  }

  async createPayment(_data: CreatePaymentData): Promise<Payment> {
    throw new Error("Payments are managed via the main distillpage billing.");
  }

  async activateTestSubscription(): Promise<{
    message: string;
    tier: string;
    subscription_active: boolean;
  }> {
    return { message: "Use distillpage billing to purchase credits.", tier: "free", subscription_active: false };
  }
}
