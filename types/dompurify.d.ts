declare module "dompurify" {
  const DOMPurify: {
    sanitize(source: string | Node, config?: Record<string, unknown>): string;
    setConfig(config: Record<string, unknown>): void;
    clearConfig(): void;
    addHook(
      entryPoint: string,
      hookFunction: (node: Element, data: unknown, config: unknown) => void,
    ): void;
    removeHook(entryPoint: string): void;
    removeHooks(entryPoint: string): void;
    removeAllHooks(): void;
    isSupported: boolean;
    version: string;
  };
  export default DOMPurify;
}
