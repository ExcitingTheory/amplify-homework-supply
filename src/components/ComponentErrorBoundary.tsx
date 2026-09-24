import React from "react";
import { Alert, Box, Button, Typography } from "@mui/material";

interface ComponentErrorBoundaryProps {
  children: React.ReactNode;
  name: string;
}

interface ComponentErrorBoundaryState {
  error: Error | null;
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
      <Box role="alert" sx={{ p: 2 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={this.handleRetry}>
              Try again
            </Button>
          }
        >
          <Typography component="span" variant="body2">
            {this.props.name} could not load. Your other work is still safe.
          </Typography>
        </Alert>
      </Box>
    );
  }
}
