export function SkipToMain() {
  return (
    <>
      <a href="#main-content" className="skip-to-main-link">
        Skip to main content
      </a>
      <style>{`
        .skip-to-main-link {
          position: absolute;
          left: -9999px;
          top: auto;
          width: 1px;
          height: 1px;
          overflow: hidden;
        }

        .skip-to-main-link:focus,
        .skip-to-main-link:focus-visible {
          position: fixed;
          left: 16px;
          top: 16px;
          width: auto;
          height: auto;
          overflow: visible;
          z-index: 99999;
          padding: 8px 16px;
          background: #1976d2;
          color: #fff;
          border-radius: 4px;
          font-size: 14px;
          text-decoration: none;
          outline: 2px solid #fff;
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
}
