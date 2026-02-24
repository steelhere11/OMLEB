import { type LabelHTMLAttributes, forwardRef } from "react";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ required, className = "", children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`block text-sm font-medium ${className}`}
        {...props}
      >
        {children}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
    );
  }
);

Label.displayName = "Label";

export { Label };
