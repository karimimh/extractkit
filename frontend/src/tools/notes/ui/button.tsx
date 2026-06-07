import { cn } from "@notes/utils/css-utils";
import { type LucideIcon } from "lucide-react";
import { type ButtonHTMLAttributes, forwardRef, Fragment, type ReactNode } from "react";
import Tooltip from "./tooltip";

export type ButtonProps = {
  children?: React.ReactNode;
  className?: string;
  variant?:
    | "main"
    | "plain"
    | "plain-light"
    | "framed"
    | "link"
    | "ghost"
    | "stone"
    | "apply"
    | "cancel"
    | "secondary"
    | "gradient-purple"
    | "gradient-orange"
    | "gradient-pink"
    | "gradient-green"
    | "gradient-sunset"
    | "gradient-ocean"
    | "gradient-light-blue";
  icon?: LucideIcon;
  iconAsNode?: ReactNode;
  iconSize?: "3" | "4" | "5" | "6" | "7";
  text?: string;
  isActive?: boolean;
  activeStyle?: string;
  tooltipMessage?: string;
  tooltipPosition?: "bottom" | "top";
  iconClassName?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant,
      icon,
      iconAsNode,
      iconSize = "4",
      text,
      isActive = false,
      activeStyle,
      tooltipMessage,
      tooltipPosition,
      iconClassName,
      ...props
    },
    ref
  ) => {
    const styles = {
      main: "bg-gradient-to-r from-persian-blue to-neon-blue disabled:bg-gray-500 text-alice-blue px-4 rounded-lg text-base hover:opacity-90 h-10 border border-transparent disabled:opacity-70 diabled:bg-gray-500",
      plain: "disabled:text-[var(--text-tertiary)] p-0 hover:opacity-70 text-[var(--text-primary)]",
      "plain-light": "disabled:text-slate-400 p-0 text-white hover:opacity-70",
      framed:
        "disabled:text-gray-500 border border-stone-500 hover:bg-stone-200 hover:text-blue-600 px-4 h-10 rounded-lg text-base",
      link: "disabled:text-gray-500 px-3 py-1 rounded-md text-base text-[var(--text-primary)] hover:underline hover:text-blue-600",
      ghost:
        "disabled:text-gray-500 px-3 py-1 rounded-md text-base hover:bg-stone-200 hover:text-blue-600",
      stone:
        "disabled:text-gray-500 px-3 py-1 rounded-md text-base hover:bg-stone-300 bg-stone-200 text-black hover:text-blue-600",
      secondary:
        "disabled:text-gray-500 px-4 py-1 h-10 rounded-md text-base hover:bg-slate-200 bg-slate-100 text-black hover:text-blue-600",
      apply:
        "disabled:text-gray-500 px-3 py-1 rounded-md text-base hover:bg-green-700 bg-green-600 text-slate-100 hover:text-white",
      cancel:
        "disabled:text-gray-500 px-3 py-1 rounded-lg text-base hover:bg-red-700 bg-red-600 text-slate-100 hover:text-white",
      "gradient-purple":
        "bg-gradient-to-r from-purple-500 to-purple-700 disabled:bg-gray-500 text-white px-4 rounded-lg text-base hover:opacity-90 h-10 border border-transparent disabled:opacity-70",
      "gradient-orange":
        "bg-gradient-to-r from-orange-400 to-orange-600 disabled:bg-gray-500 text-white px-4 rounded-lg text-base hover:opacity-90 h-10 border border-transparent disabled:opacity-70",
      "gradient-pink":
        "bg-gradient-to-r from-pink-400 to-pink-600 disabled:bg-gray-500 text-white px-4 rounded-lg text-base hover:opacity-90 h-10 border border-transparent disabled:opacity-70",
      "gradient-green":
        "bg-gradient-to-r from-green-400 to-green-600 disabled:bg-gray-500 text-white px-4 rounded-lg text-base hover:opacity-90 h-10 border border-transparent disabled:opacity-70",
      "gradient-sunset":
        "bg-gradient-to-r from-orange-300 via-red-400 to-pink-500 disabled:bg-gray-500 text-white px-4 rounded-lg text-base hover:opacity-90 h-10 border border-transparent disabled:opacity-70",
      "gradient-ocean":
        "bg-gradient-to-r from-blue-400 via-teal-400 to-cyan-500 disabled:bg-gray-500 text-white px-4 rounded-lg text-base hover:opacity-90 h-10 border border-transparent disabled:opacity-70",
      "gradient-light-blue":
        "bg-gradient-to-r from-sky-300 to-blue-400 disabled:bg-gray-500 text-white px-4 rounded-lg text-base hover:opacity-90 h-10 border border-transparent disabled:opacity-70",
    };
    const activeStyles = {
      main: "from-persian-green to-mint-green text-[yellow]",
      plain: "bg-slate-200 rounded",
      "plain-light": "bg-slate-200 text-black rounded",
      framed: "bg-stone-200 text-blue-600",
      link: "underline text-blue-600",
      ghost: "bg-stone-200 text-blue-600",
      stone: "bg-stone-300 text-blue-600",
      secondary: "bg-slate-200 text-blue-600",
      apply: "bg-green-700 text-white",
      cancel: "bg-red-700 text-white",
      "gradient-purple": "from-purple-600 to-purple-800 text-yellow-200",
      "gradient-orange": "from-orange-500 to-orange-700 text-yellow-200",
      "gradient-pink": "from-pink-500 to-pink-700 text-yellow-200",
      "gradient-green": "from-green-500 to-green-700 text-yellow-200",
      "gradient-sunset": "from-orange-400 via-red-500 to-pink-600 text-yellow-200",
      "gradient-ocean": "from-blue-500 via-teal-500 to-cyan-600 text-yellow-200",
      "gradient-light-blue": "from-sky-400 to-blue-500 text-yellow-200",
    };
    const Icon = icon ?? Fragment;
    const iconStyles = {
      "3": "w-3 h-3",
      "4": "w-4 h-4",
      "5": "w-5 h-5",
      "6": "w-6 h-6",
      "7": "w-7 h-7",
    };
    const buttonContent = (
      <button
        {...props}
        className={cn(
          "cursor-pointer",
          variant ? styles[variant] : "",
          isActive ? activeStyle ?? (variant ? activeStyles[variant] : "") : "",
          icon ? "flex items-center justify-start gap-1" : "",
          className
        )}
        ref={ref}
      >
        {icon ? <Icon className={cn(iconStyles[iconSize], iconClassName)} /> : null}
        {iconAsNode}
        {text ?? children}
      </button>
    );
    return tooltipMessage ? (
      <Tooltip message={tooltipMessage} messagePosition={tooltipPosition}>
        {buttonContent}
      </Tooltip>
    ) : (
      buttonContent
    );
  }
);

Button.displayName = "Button";

export default Button;
