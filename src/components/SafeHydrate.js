
export default function SafeHydrate({ children }) {
  /**
   * @fileoverview SafeHydrate is a React component that prevents the
   * hydration warning from appearing in the console.
   */
    return (
      <div suppressHydrationWarning>
        {typeof window === 'undefined' ? null : children}
      </div>
    )
  }
  