import { cn } from "@notes/utils/css-utils";

interface BadgeProps {
  className?: string;
  children?: React.ReactNode;
  variant?:
    | "blue"
    | "dark"
    | "red"
    | "green"
    | "yellow"
    | "indigo"
    | "purple"
    | "pink"
    | "plain"
    | "light-gray"
    | "gray";
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
}

const Badge: React.FC<BadgeProps> = ({
  className,
  children,
  variant = "plain",
  bgColor,
  borderColor,
  textColor,
}) => {
  const variantClasses = {
    plain: "text-sm font-medium px-3 py-1 rounded-full",
    blue: "bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300",
    dark: "bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-gray-700 dark:text-gray-300",
    red: "bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-red-900 dark:text-red-300",
    green:
      "bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-green-900 dark:text-green-300",
    yellow:
      "bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-yellow-900 dark:text-yellow-300",
    indigo:
      "bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-indigo-900 dark:text-indigo-300",
    purple:
      "bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-purple-900 dark:text-purple-300",
    pink: "bg-pink-100 text-pink-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-pink-900 dark:text-pink-300",
    "light-gray":
      "bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-gray-700 dark:text-gray-300",
    gray: "bg-gray-200 text-gray-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-gray-600 dark:text-gray-200",
  };

  return (
    <div
      className={cn(variantClasses[variant], className)}
      style={{ backgroundColor: bgColor, color: textColor, borderColor: borderColor }}
    >
      {children}
    </div>
  );
};

export default Badge;
