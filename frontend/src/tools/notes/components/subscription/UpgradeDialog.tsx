import { useSubscription } from "@notes/context/SubscriptionContext";
import Button from "@notes/ui/button";
import Dialog from "@notes/ui/dialog/dialog";
import { apiClient } from "@notes/utils/api";
import { Check, Crown, Sparkles, X, Zap } from "lucide-react";
import { useState } from "react";
import { showError, showSuccess } from "@notes/utils/toast-handler";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hideTrigger?: boolean;
}

interface PlanFeature {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  description?: string;
}

const PLAN_FEATURES: PlanFeature[] = [
  { name: "Notes", free: true, pro: true, description: "Create and manage your notes" },
  {
    name: "Markdown Support",
    free: true,
    pro: true,
    description: "Rich text formatting with markdown",
  },
  {
    name: "Labels & Organization",
    free: true,
    pro: true,
    description: "Organize notes with custom labels",
  },
  { name: "Image Uploads", free: true, pro: true, description: "Add images to your notes" },
  {
    name: "AI Assistant",
    free: false,
    pro: true,
    description: "Intelligent note management, statistics, and automated actions",
  },
  {
    name: "AI Note Generation",
    free: false,
    pro: true,
    description: "Generate note content from prompts",
  },
  {
    name: "AI Summarization",
    free: false,
    pro: true,
    description: "Get concise summaries of your notes",
  },
  {
    name: "AI Translation",
    free: false,
    pro: true,
    description: "Translate notes to any language",
  },
  {
    name: "Note Count Limit",
    free: "100",
    pro: "Unlimited",
    description: "Maximum number of notes you can create",
  },
  {
    name: "Note Character Limit",
    free: "50,000",
    pro: "Unlimited",
    description: "Character limit per note",
  },
  {
    name: "Storage Limit",
    free: "20MB",
    pro: "Unlimited",
    description: "Total storage for images and attachments",
  },
];

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    icon: Sparkles,
  },
  {
    id: "annual",
    name: "Pro Annual",
    price: "$49",
    period: "per year",
    description: "Best value - unlimited everything",
    icon: Zap,
    popular: true,
  },
  {
    id: "monthly",
    name: "Pro Monthly",
    price: "$5",
    period: "per month",
    description: "Pay as you go",
    icon: Zap,
  },
];

export function UpgradeDialog({ open, onOpenChange, hideTrigger = false }: UpgradeDialogProps) {
  const { subscription, refreshSubscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string>("annual");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = async () => {
    if (selectedPlan === "free") {
      onOpenChange(false);
      return;
    }

    setIsProcessing(true);
    try {
      // For now, mock the payment and directly activate test subscription
      await apiClient.subscription.activateTestSubscription();

      // Refresh subscription status
      await refreshSubscription();

      // Show success message
      showSuccess("🎉 Successfully upgraded to Pro!");

      onOpenChange(false);
    } catch (error) {
      console.error("Error upgrading:", error);
      showError("Failed to upgrade. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const isPro = subscription?.is_pro ?? false;

  return (
    <Dialog isOpen={open} onOpenChange={onOpenChange}>
      {!hideTrigger && (
        <Dialog.Trigger
          variant="link"
          icon={Crown}
          iconSize="5"
          text={isPro ? "Pro User" : "Upgrade to Pro"}
          className="hidden sm:flex"
        />
      )}
      <Dialog.Content className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <Dialog.Content.Header>
          <h2 className="text-3xl font-bold text-center">
            {isPro ? "Manage Your Subscription" : "Upgrade to Pro"}
          </h2>
          <p className="text-center text-lg text-[var(--text-secondary)] mt-2">
            {isPro
              ? "You are currently on the Pro plan"
              : "Unlock unlimited notes, storage, and AI-powered features"}
          </p>
        </Dialog.Content.Header>

        {/* Plan Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 px-3">
          {PLANS.map(plan => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            const isCurrent = isPro && plan.id !== "free";

            return (
              <div
                key={plan.id}
                onClick={() => !isPro && setSelectedPlan(plan.id)}
                className={`relative p-6 rounded-lg border-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                } ${isCurrent ? "ring-2 ring-green-500" : ""} ${
                  isPro ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                {plan.popular && !isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
                    BEST VALUE
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    CURRENT PLAN
                  </div>
                )}

                <div className="flex items-center justify-center mb-4">
                  <Icon
                    className={`w-10 h-10 ${
                      plan.id === "free" ? "text-gray-500" : "text-blue-500"
                    }`}
                  />
                </div>

                <h3 className="text-xl font-bold text-center mb-2">{plan.name}</h3>

                <div className="text-center mb-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                    {plan.period}
                  </span>
                </div>

                <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
                  {plan.description}
                </p>

                {!isPro && isSelected && plan.id !== "free" && (
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-8 px-3">
          <h3 className="text-xl font-semibold mb-4 text-center">Feature Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                  <th className="text-left p-3 font-semibold">Feature</th>
                  <th className="text-center p-3 font-semibold">Free</th>
                  <th className="text-center p-3 font-semibold">Pro</th>
                </tr>
              </thead>
              <tbody>
                {PLAN_FEATURES.map((feature, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{feature.name}</span>
                        {feature.description && (
                          <span className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {feature.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-center p-3">
                      {typeof feature.free === "boolean" ? (
                        feature.free ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm font-medium">{feature.free}</span>
                      )}
                    </td>
                    <td className="text-center p-3">
                      {typeof feature.pro === "boolean" ? (
                        feature.pro ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm font-medium">{feature.pro}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        {!isPro && (
          <div className="flex gap-4 mt-8 px-3">
            <Button
              variant="framed"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isProcessing}
            >
              Maybe Later
            </Button>
            <Button
              variant="main"
              onClick={handleUpgrade}
              className="flex-1"
              disabled={isProcessing || selectedPlan === "free"}
            >
              {isProcessing
                ? "Processing..."
                : selectedPlan === "free"
                ? "Stay Free"
                : `Upgrade to ${PLANS.find(p => p.id === selectedPlan)?.name}`}
            </Button>
          </div>
        )}

        {isPro && (
          <div className="mt-8 text-center">
            <p className="text-green-600 dark:text-green-400 font-semibold">
              ✨ You're enjoying all Pro features!
            </p>
            {subscription?.subscription_end_date && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Subscription active until{" "}
                {new Date(subscription.subscription_end_date).toLocaleDateString()}
                {subscription.days_remaining && ` (${subscription.days_remaining} days remaining)`}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-b-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> This is a demo. Payment integration is mocked. In production,
            you'll be redirected to a secure crypto payment page.
          </p>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
