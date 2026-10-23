import React from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

interface ComponentErrorBoundaryProps {
  children: React.ReactNode;
  name: string;
}

interface ComponentErrorBoundaryState {
  error: Error | null;
}

interface ComponentErrorFallbackProps {
  name: string;
  onRetry: () => void;
}

function ComponentErrorFallback({
  name,
  onRetry,
}: ComponentErrorFallbackProps) {
  const t = useTranslations("components");

  return (
    <Box role="alert" sx={{ p: 2 }}>
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
            {t("componentErrorBoundary.tryAgain")}
          </Button>
        }
      >
        <Typography component="span" variant="body2">
          {t("componentErrorBoundary.couldNotLoad", { name })}
        </Typography>
      </Alert>
    </Box>
  );
}

export default class ComponentErrorBoundary extends React.Component<
  ComponentErrorBoundaryProps,
  ComponentErrorBoundaryState
> {
  state: ComponentErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ComponentErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[${this.props.name}] component error`, error, info);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <ComponentErrorFallback
        name={this.props.name}
        onRetry={this.handleRetry}
      />
    );
  }
}
