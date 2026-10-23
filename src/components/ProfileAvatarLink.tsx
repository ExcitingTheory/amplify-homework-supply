"use client";

import React from "react";
import MuiLink, { type LinkProps } from "@mui/material/Link";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export interface ProfileAvatarLinkProps
  extends Omit<LinkProps, "href" | "component"> {
  /** The profile's user ID, never its customizable avatar seed. */
  username?: string | null;
  displayName?: string | null;
}

export const ProfileAvatarLink = React.forwardRef<
  HTMLAnchorElement,
  ProfileAvatarLinkProps
>(function ProfileAvatarLink(
  { username, displayName, children, sx, onClick, onKeyDown, ...props },
  ref,
) {
  const t = useTranslations("common");
  return (
    <MuiLink
      {...props}
      ref={ref}
      component={username ? Link : "a"}
      href={username ? `/profile/${encodeURIComponent(username)}` : undefined}
      {...(username ? { prefetch: false } : {})}
      aria-label={
        username
          ? t("navigation.userProfile", { name: displayName || username })
          : undefined
      }
      color="inherit"
      underline="none"
      sx={[
        {
          display: "inline-flex",
          flexShrink: 0,
          borderRadius: "50%",
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: 3,
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
        onKeyDown?.(event);
      }}
    >
      {children}
    </MuiLink>
  );
});
