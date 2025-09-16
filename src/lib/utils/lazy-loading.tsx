import React, { lazy, Suspense, type ComponentType } from 'react';
import { LoadingSpinner } from '~/components/ui/loading-spinner';

/**
 * Higher-order component for lazy loading with suspense
 */
export function withLazyLoading<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapper(props: T) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Lazy loading with error boundary
 */
export function withLazyLoadingAndErrorBoundary<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode,
  errorFallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapperWithErrorBoundary(props: T) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Preload a lazy component
 */
export function preloadComponent(importFn: () => Promise<{ default: ComponentType<any> }>) {
  return importFn();
}

/**
 * Intersection Observer based lazy loading for components
 */
export function withIntersectionObserver<T extends object>(
  Component: ComponentType<T>,
  options?: IntersectionObserverInit
) {
  return function IntersectionObserverWrapper(props: T) {
    const [isVisible, setIsVisible] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);
    
    React.useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        {
          threshold: 0.1,
          rootMargin: '50px',
          ...options,
        }
      );
      
      if (ref.current) {
        observer.observe(ref.current);
      }
      
      return () => observer.disconnect();
    }, []);
    
    return (
      <div ref={ref}>
        {isVisible ? <Component {...props} /> : <div className="h-32 animate-pulse bg-gray-200 rounded" />}
      </div>
    );
  };
}