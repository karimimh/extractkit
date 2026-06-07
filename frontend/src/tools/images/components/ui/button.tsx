import { cn } from "@images/utils/css-utils";
import { LucideIcon } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef, Fragment, ReactNode } from "react";
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
    | "secondary";
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
      plain: "disabled:text-gray-500 p-0 text-black hover:opacity-70",
      "plain-light": "disabled:text-slate-400 p-0 text-white hover:opacity-70",
      framed:
        "disabled:text-gray-500 border border-stone-500 hover:bg-stone-200 hover:text-blue-600 px-4 h-10 rounded-lg text-base",
      link: "disabled:text-gray-500 px-3 py-1 rounded-md text-base hover:underline hover:text-blue-600",
      ghost:
        "disabled:text-gray-500 px-3 py-1 rounded-md text-base hover:bg-stone-200 hover:text-blue-600",
      stone:
        "disabled:text-gray-500 px-3 py-1 rounded-md text-base hover:bg-stone-300 bg-stone-200 text-black hover:text-blue-600",
      secondary:
        "disabled:text-gray-500 px-3 py-1 rounded-md text-base hover:bg-slate-200 bg-slate-100 text-black hover:text-blue-600",
      apply:
        "disabled:text-gray-500 px-3 py-1 rounded-md text-base hover:bg-green-700 bg-green-600 text-slate-100 hover:text-white",
      cancel:
        "disabled:text-gray-500 px-3 py-1 rounded-lg text-base hover:bg-red-700 bg-red-600 text-slate-100 hover:text-white",
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
          variant ? styles[variant] : "",
          isActive ? (activeStyle ?? (variant ? activeStyles[variant] : "")) : "",
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
