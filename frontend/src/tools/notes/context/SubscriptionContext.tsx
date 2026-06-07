import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "../utils/api";
import type { SubscriptionStatus } from "../types/subscription-types";
import { useAuth } from "../hooks/use-auth";

interface SubscriptionContextType {
  subscription: SubscriptionStatus | null;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
  isPro: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSubscription = async () => {
    if (!isAuthenticated) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const status = await apiClient.subscription.getSubscriptionStatus();
      setSubscription(status);
    } catch (error) {
      console.error("Failed to fetch subscription status:", error);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      refreshSubscription();
    }
  }, [isAuthenticated, authLoading]);

  const value: SubscriptionContextType = {
    subscription,
    isLoading,
    refreshSubscription,
    isPro: subscription?.is_pro ?? false,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
};
