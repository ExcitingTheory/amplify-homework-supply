import "react";

// Next 15 builds with `experimental.viewTransition` against its bundled
// experimental React, which exports ViewTransition as `unstable_ViewTransition`.
// @types/react only declares the stable name.
declare module "react" {
  export const unstable_ViewTransition: typeof ViewTransition;
}
