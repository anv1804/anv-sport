import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "danger" | "secondary" | "gradient" | "success" | "blue"
  size?: "default" | "sm" | "lg" | "icon"
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 disabled:pointer-events-none disabled:opacity-50 shadow-sm",
          {
            "bg-slate-800 text-white hover:bg-slate-900 shadow-md": variant === "default",
            "bg-emerald-600 text-white hover:bg-emerald-700": variant === "success",
            "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50": variant === "outline",
            "bg-gray-50 text-gray-600 hover:bg-gray-100": variant === "secondary",
            "bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:shadow-md": variant === "gradient",
            "bg-blue-50 text-blue-600 hover:bg-blue-100": variant === "blue",
            "bg-red-50 text-red-600 hover:bg-red-100": variant === "danger",
            "hover:bg-slate-100 hover:text-slate-900 shadow-none": variant === "ghost",
            "px-4 py-2.5 text-sm": size === "default",
            "px-3 py-1.5 text-xs rounded-md": size === "sm",
            "px-6 py-3 text-base rounded-xl": size === "lg",
            "p-2": size === "icon",
          },
          className
        )}
        {...props}
      >
        {isLoading && (
          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
