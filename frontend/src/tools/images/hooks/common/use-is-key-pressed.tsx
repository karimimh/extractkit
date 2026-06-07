// useIsKeyPressed hook
import { useCallback, useEffect, useState } from "react";

const useIsKeyPressed = (targetKey: string): boolean => {
  const [isKeyPressed, setIsKeyPressed] = useState<boolean>(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        setIsKeyPressed(true);
      }
    },
    [targetKey]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        setIsKeyPressed(false);
      }
    },
    [targetKey]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return isKeyPressed;
};

export default useIsKeyPressed;
