"use client";

import { useSubscription } from "@notes/context/SubscriptionContext";
import { useTheme } from "@notes/context/ThemeContext";
import { useAuth } from "@notes/hooks/use-auth";
import Menu from "@notes/ui/menu";
import { LogOutIcon, MessageCircle, Moon, Sun, User, UserRound } from "lucide-react";
import { useState } from "react";
import ProfileDialog from "../profile/profile-dialog";
import SupportDialog from "../support/support-dialog";

const HeaderMenu = () => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const { isPro } = useSubscription();

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    ...[
      {
        id: "profile",
        label: "Profile",
        icon: <User className="w-4 h-4" />,
        onClick: () => setShowProfile(true),
      },
    ],
    ...(isPro
      ? [
          {
            id: "support",
            label: "Support",
            icon: <MessageCircle className="w-4 h-4" />,
            onClick: () => setShowSupport(true),
          },
        ]
      : []),
    {
      id: "theme-toggle",
      label: theme === "light" ? "Dark Mode" : "Light Mode",
      icon: theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />,
      onClick: toggleTheme,
    },
    {
      id: "logout",
      label: "Logout",
      icon: <LogOutIcon className="size-4" />,
      onClick: handleLogout,
    },
  ];

  return (
    <>
      <Menu
        trigger={
          <UserRound className="rounded-full bg-[var(--bg-tertiary)] p-1 size-7 text-[var(--text-primary)]" />
        }
        items={menuItems}
        placement="bottom-end"
        menuClassName="z-[60]"
        title="Settings"
      />
      {/* Profile Dialog */}
      <ProfileDialog isOpen={showProfile} onOpenChange={setShowProfile} />
      {/* Support Dialog */}
      {isPro && <SupportDialog isOpen={showSupport} onOpenChange={setShowSupport} />}
    </>
  );
};

export default HeaderMenu;
