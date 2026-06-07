import { cn } from "@notes/utils/css-utils";
import Tooltip from "./tooltip";

interface TruncatedTextProps {
  text?: string;
  className?: string;
}

const TruncatedText = ({ text = "", className }: TruncatedTextProps) => {
  return (
    <Tooltip message={text}>
      <div className={cn("truncate", className)}>{text}</div>
    </Tooltip>
  );
};

export default TruncatedText;
