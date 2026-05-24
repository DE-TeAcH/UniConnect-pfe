import * as React from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";

import { Button } from "./button";
import { Input } from "./input";

export type PasswordInputProps = React.ComponentProps<typeof Input> & {
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  showValidation?: boolean;
};

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, visible, onVisibleChange, showValidation, onFocus, onBlur, ...props }, ref) => {
    const [internalVisible, setInternalVisible] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const isControlled = visible !== undefined;
    const isVisible = isControlled ? visible : internalVisible;

    const setVisible = (nextVisible: boolean) => {
      if (!isControlled) {
        setInternalVisible(nextVisible);
      }
      onVisibleChange?.(nextVisible);
    };

    const value = String(props.value || "");

    const rules = {
      length: value.length >= 8,
      upper: /[A-Z]/.test(value),
      lower: /[a-z]/.test(value),
      number: /\d/.test(value),
      symbol: /[^A-Za-z0-9]/.test(value),
    };

    const isValid = Object.values(rules).every(Boolean);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const validationClasses = showValidation && !isValid && value.length > 0
      ? "border-red-500 focus-visible:ring-red-500"
      : "";

    return (
      <div className="relative">
        {showValidation && isFocused && (
          <div className="absolute bottom-full left-0 mb-2 w-full sm:w-80 bg-popover text-popover-foreground border shadow-lg rounded-md p-3 z-50 animate-in fade-in zoom-in duration-200">
            <p className="font-semibold text-sm mb-2">Password must contain:</p>
            <ul className="space-y-1 text-xs">
              <li className="flex items-center gap-2">
                {rules.length ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-500" />}
                <span className={rules.length ? "text-green-600 dark:text-green-400" : ""}>At least 8 characters</span>
              </li>
              <li className="flex items-center gap-2">
                {rules.upper ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-500" />}
                <span className={rules.upper ? "text-green-600 dark:text-green-400" : ""}>One uppercase letter</span>
              </li>
              <li className="flex items-center gap-2">
                {rules.lower ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-500" />}
                <span className={rules.lower ? "text-green-600 dark:text-green-400" : ""}>One lowercase letter</span>
              </li>
              <li className="flex items-center gap-2">
                {rules.number ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-500" />}
                <span className={rules.number ? "text-green-600 dark:text-green-400" : ""}>One number</span>
              </li>
              <li className="flex items-center gap-2">
                {rules.symbol ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-500" />}
                <span className={rules.symbol ? "text-green-600 dark:text-green-400" : ""}>One special character</span>
              </li>
            </ul>
          </div>
        )}
        <Input
          {...props}
          ref={ref}
          type={isVisible ? "text" : "password"}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`pr-11 ${validationClasses} ${className ?? ""}`.trim()}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={() => setVisible(!isVisible)}
          aria-label={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
