import { useEffect, useState } from "react";

export const useDragDropInfo = (enableDragDrop: boolean) => {
  const [showDragInfo, setShowDragInfo] = useState(false);
  const [dragCount, setDragCount] = useState(() => {
    const saved = localStorage.getItem("dragDropCount");
    return saved ? parseInt(saved, 10) : 0;
  });

  // Show banner when custom order is enabled and user hasn't dragged more than once
  useEffect(() => {
    if (enableDragDrop && dragCount <= 1) {
      setShowDragInfo(true);
    } else {
      setShowDragInfo(false);
    }
  }, [enableDragDrop, dragCount]);

  const handleDragComplete = () => {
    const newCount = dragCount + 1;
    setDragCount(newCount);
    localStorage.setItem("dragDropCount", newCount.toString());
  };

  const handleDismissBanner = () => {
    setShowDragInfo(false);
    // Mark as if user has dragged twice to prevent showing again
    const newCount = 2;
    setDragCount(newCount);
    localStorage.setItem("dragDropCount", newCount.toString());
  };

  return {
    showDragInfo,
    handleDragComplete,
    handleDismissBanner,
  };
};
