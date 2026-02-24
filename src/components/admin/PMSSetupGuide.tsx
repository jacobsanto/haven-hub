import { ExternalLink, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SetupStep {
  title: string;
  description: string;
  docsLink?: string;
}

interface PMSSetupGuideProps {
  steps: SetupStep[];
  providerName: string;
}

export function PMSSetupGuide({ steps, providerName }: PMSSetupGuideProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-medium">Setup Guide for {providerName}</h4>
      <p className="text-sm text-muted-foreground">
        Follow these steps to prepare your {providerName} account before connecting.
      </p>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex gap-3 p-3 rounded-lg border bg-muted/30"
          >
            <div className="flex-shrink-0 mt-0.5">
              <Badge
                variant="outline"
                className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold"
              >
                {index + 1}
              </Badge>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="font-medium text-sm">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.description}</p>
              {step.docsLink && (
                <a
                  href={step.docsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  View documentation
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
