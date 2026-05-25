'use client';

import React from 'react';
import NextLink from 'next/link';
import { Button, ButtonProps } from '@mui/material';

type PrefetchButtonProps = ButtonProps & {
  href: string;
  prefetch?: boolean;
};

/**
 * MUI Button that renders as a Next.js Link for automatic route prefetching.
 * Drop-in replacement for `<Button href="...">` that enables client-side
 * transitions and background prefetch of linked routes.
 */
export const PrefetchButton = React.forwardRef<HTMLAnchorElement, PrefetchButtonProps>(
  function PrefetchButton({ href, prefetch = true, children, ...buttonProps }, ref) {
    return (
      <Button
        component={NextLink}
        href={href}
        prefetch={prefetch}
        ref={ref}
        {...buttonProps}
      >
        {children}
      </Button>
    );
  }
);
