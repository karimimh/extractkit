import { Check, Copy } from "lucide-react";
import { useState } from "react";
import Tooltip from "./tooltip";

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: number;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text, className = "", size = 16 }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Tooltip message={copied ? "Copied!" : "Copy to clipboard"}>
      <button
        type="button"
        onClick={handleCopy}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${className}`}
        aria-label="Copy to clipboard"
      >
        {copied ? (
          <Check size={size} className="text-green-600 dark:text-green-400" />
        ) : (
          <Copy size={size} className="text-gray-600 dark:text-gray-400" />
        )}
      </button>
    </Tooltip>
  );
};

export default CopyButton;
