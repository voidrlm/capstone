import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, id, style, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div
        style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}
      >
        {label && (
          <label
            htmlFor={selectId}
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#374151",
            }}
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          style={{
            width: "100%",
            padding: "0.75rem 2.5rem 0.75rem 1rem",
            border: `2px solid ${error ? "#ef4444" : "#e5e7eb"}`,
            borderRadius: "0.5rem",
            fontSize: "1rem",
            color: "#1f2937",
            backgroundColor: "white",
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: "right 0.5rem center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "1.5rem 1.5rem",
            appearance: "none",
            cursor: "pointer",
            transition: "border-color 0.2s, box-shadow 0.2s",
            outline: "none",
            ...style,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = error ? "#ef4444" : "#0891b2";
            e.target.style.boxShadow = error
              ? "0 0 0 3px rgba(239, 68, 68, 0.1)"
              : "0 0 0 3px rgba(8, 145, 178, 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? "#ef4444" : "#e5e7eb";
            e.target.style.boxShadow = "none";
          }}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.icon ? `${option.icon} ${option.label}` : option.label}
            </option>
          ))}
        </select>
        {error && (
          <span style={{ fontSize: "0.75rem", color: "#ef4444" }}>{error}</span>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

export default Select;
