import { useState } from "react";
import { Eye, EyeOff, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PMSProviderConfig, AuthFieldConfig } from "@/lib/pms-providers";

interface PMSCredentialsFormProps {
  provider: PMSProviderConfig;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
}

function CredentialField({
  field,
  value,
  onChange,
  disabled,
}: {
  field: AuthFieldConfig;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = field.type === "password";
  const inputType = isPassword && !showPassword ? "password" : "text";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={field.key}>
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {field.helpText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p>{field.helpText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="relative">
        <Input
          id={field.key}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          className={isPassword ? "pr-10" : ""}
        />
        {isPassword && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="sr-only">
              {showPassword ? "Hide" : "Show"} {field.label}
            </span>
          </Button>
        )}
      </div>
      {field.helpText && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}
    </div>
  );
}

export function PMSCredentialsForm({
  provider,
  values,
  onChange,
  disabled,
}: PMSCredentialsFormProps) {
  return (
    <div className="space-y-4">
      <div className="border-b pb-2">
        <h4 className="font-medium">{provider.name} Configuration</h4>
        <p className="text-sm text-muted-foreground">
          Enter your API credentials to connect to {provider.name}
        </p>
      </div>

      <div className="space-y-4">
        {provider.authFields.map((field) => (
          <CredentialField
            key={field.key}
            field={field}
            value={values[field.key] || ""}
            onChange={(value) => onChange(field.key, value)}
            disabled={disabled}
          />
        ))}
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-3">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          <strong>Note:</strong> Your credentials are stored securely as encrypted secrets and are never exposed in the browser.
        </p>
      </div>
    </div>
  );
}
