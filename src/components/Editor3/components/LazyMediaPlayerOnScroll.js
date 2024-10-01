import React, { lazy, Suspense, useEffect, useRef } from 'react';
const MediaPlayerComponent = lazy(() => import('./MediaPlayerComponent'));

function LazyMediaPlayerOnScroll({
    className,
    format,
    nodeKey,
    fileIDs,
}) {
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Load the lazy component when it's in view
        //   MediaPlayerComponent();
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px 100px 0px' } // Adjust the root margin as needed
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div ref={ref}>
      <Suspense fallback={<div>Loading...</div>}>
        <MediaPlayerComponent
            className={className}
            format={format}
            nodeKey={nodeKey}
            fileIDs={fileIDs}
            />
      </Suspense>
    </div>
  );
}

export default LazyMediaPlayerOnScroll;