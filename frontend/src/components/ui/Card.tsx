import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { children, variant = "elevated", padding = "lg", style, ...props },
    ref,
  ) => {
    const getPadding = () => {
      switch (padding) {
        case "none":
          return "0";
        case "sm":
          return "1rem";
        case "md":
          return "1.5rem";
        case "lg":
          return "2rem";
        default:
          return "2rem";
      }
    };

    const getVariantStyles = (): React.CSSProperties => {
      switch (variant) {
        case "outlined":
          return {
            border: "1px solid #e5e7eb",
            boxShadow: "none",
          };
        case "elevated":
          return {
            border: "none",
            boxShadow:
              "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
          };
        default:
          return {
            border: "none",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          };
      }
    };

    return (
      <div
        ref={ref}
        style={{
          backgroundColor: "white",
          borderRadius: "1rem",
          padding: getPadding(),
          ...getVariantStyles(),
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export default Card;
