import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "provider";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = "",
      ...props
    },
    ref,
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center font-medium rounded-lg
      transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variants = {
      primary: `
        bg-gradient-to-r from-cyan-600 to-cyan-700 text-white
        hover:from-cyan-700 hover:to-cyan-800
        focus:ring-cyan-500 shadow-md hover:shadow-lg
      `,
      secondary: `
        bg-gradient-to-r from-blue-600 to-blue-700 text-white
        hover:from-blue-700 hover:to-blue-800
        focus:ring-blue-500 shadow-md hover:shadow-lg
      `,
      outline: `
        border-2 border-cyan-600 text-cyan-700 bg-transparent
        hover:bg-cyan-50 focus:ring-cyan-500
      `,
      ghost: `
        text-neutral-600 bg-transparent
        hover:bg-neutral-100 focus:ring-neutral-500
      `,
      provider: `
        bg-gradient-to-r from-emerald-600 to-emerald-700 text-white
        hover:from-emerald-700 hover:to-emerald-800
        focus:ring-emerald-500 shadow-md hover:shadow-lg
      `,
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm gap-1.5",
      md: "px-4 py-2.5 text-base gap-2",
      lg: "px-6 py-3 text-lg gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`
          .replace(/\s+/g, " ")
          .trim()}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 500,
          borderRadius: "0.5rem",
          transition: "all 0.2s ease-in-out",
          cursor: disabled || isLoading ? "not-allowed" : "pointer",
          opacity: disabled || isLoading ? 0.5 : 1,
          ...getVariantStyles(variant),
          ...getSizeStyles(size),
        }}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin"
            style={{
              width: "1rem",
              height: "1rem",
              marginRight: "0.5rem",
              animation: "spin 1s linear infinite",
            }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              style={{ opacity: 0.25 }}
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              style={{ opacity: 0.75 }}
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {leftIcon && !isLoading && (
          <span style={{ display: "flex" }}>{leftIcon}</span>
        )}
        {children}
        {rightIcon && <span style={{ display: "flex" }}>{rightIcon}</span>}
      </button>
    );
  },
);

function getVariantStyles(variant: string): React.CSSProperties {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(to right, #0891b2, #0e7490)",
      color: "white",
      border: "none",
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    },
    secondary: {
      background: "linear-gradient(to right, #2563eb, #1d4ed8)",
      color: "white",
      border: "none",
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    },
    outline: {
      background: "transparent",
      color: "#0891b2",
      border: "2px solid #0891b2",
    },
    ghost: {
      background: "transparent",
      color: "#4b5563",
      border: "none",
    },
    provider: {
      background: "linear-gradient(to right, #16a34a, #15803d)",
      color: "white",
      border: "none",
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    },
  };
  return styles[variant] || styles.primary;
}

function getSizeStyles(size: string): React.CSSProperties {
  const styles: Record<string, React.CSSProperties> = {
    sm: { padding: "0.375rem 0.75rem", fontSize: "0.875rem", gap: "0.375rem" },
    md: { padding: "0.625rem 1rem", fontSize: "1rem", gap: "0.5rem" },
    lg: { padding: "0.75rem 1.5rem", fontSize: "1.125rem", gap: "0.625rem" },
  };
  return styles[size] || styles.md;
}

Button.displayName = "Button";

export default Button;
