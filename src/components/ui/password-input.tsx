import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "./button";
import { Input } from "./input";

type PasswordInputProps = React.ComponentProps<typeof Input> & {
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
};

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, visible, onVisibleChange, ...props }, ref) => {
    const [internalVisible, setInternalVisible] = React.useState(false);
    const isControlled = visible !== undefined;
    const isVisible = isControlled ? visible : internalVisible;

    const setVisible = (nextVisible: boolean) => {
      if (!isControlled) {
        setInternalVisible(nextVisible);
      }
      onVisibleChange?.(nextVisible);
    };

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type={isVisible ? "text" : "password"}
          className={`pr-11 ${className ?? ""}`.trim()}
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
