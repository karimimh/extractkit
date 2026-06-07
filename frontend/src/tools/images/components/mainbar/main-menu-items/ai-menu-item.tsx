"use client";

import Button from "@images/components/ui/button";
import { useUIActions } from "@images/context/ui/actions";
import { useUIContext } from "@images/context/ui/use-ui-context";
import { Sparkles } from "lucide-react";

const AiMenuItem = () => {
  const { setSelectedMenu } = useUIActions();
  const { selectedMenu } = useUIContext();
  return (
    <Button
      className="p-1 rounded"
      isActive={selectedMenu === "ai"}
      onClick={() => {
        if (selectedMenu === "ai") {
          setSelectedMenu(undefined);
        } else {
          setSelectedMenu("ai");
        }
      }}
      variant="plain"
    >
      <Sparkles className="size-6" />
    </Button>
  );
};

export default AiMenuItem;
