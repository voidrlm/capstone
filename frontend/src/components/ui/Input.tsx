import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helperText, leftIcon, rightIcon, id, style, ...props },
    ref,
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div
        style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}
      >
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#374151",
            }}
          >
            {label}
          </label>
        )}
        <div style={{ position: "relative" }}>
          {leftIcon && (
            <span
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
                display: "flex",
                alignItems: "center",
              }}
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              paddingLeft: leftIcon ? "2.75rem" : "1rem",
              paddingRight: rightIcon ? "2.75rem" : "1rem",
              border: `2px solid ${error ? "#ef4444" : "#e5e7eb"}`,
              borderRadius: "0.5rem",
              fontSize: "1rem",
              color: "#1f2937",
              backgroundColor: "white",
              transition: "border-color 0.2s, box-shadow 0.2s",
              outline: "none",
              ...style,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = error ? "#ef4444" : "#0891b2";
              e.target.style.boxShadow = error
                ? "0 0 0 3px rgba(239, 68, 68, 0.1)"
                : "0 0 0 3px rgba(8, 145, 178, 0.1)";
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error ? "#ef4444" : "#e5e7eb";
              e.target.style.boxShadow = "none";
              props.onBlur?.(e);
            }}
            {...props}
          />
          {rightIcon && (
            <span
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
                display: "flex",
                alignItems: "center",
              }}
            >
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <span style={{ fontSize: "0.75rem", color: "#ef4444" }}>{error}</span>
        )}
        {helperText && !error && (
          <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
            {helperText}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
