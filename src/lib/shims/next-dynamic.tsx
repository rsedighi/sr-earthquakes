import React, { lazy, Suspense, type ComponentType } from 'react';

interface DynamicOptions<P> {
  loading?: () => React.ReactNode;
  ssr?: boolean;
  suspense?: boolean;
}

type DynamicImport<P> = () => Promise<{ default: ComponentType<P> } | ComponentType<P>>;

function dynamic<P extends object>(
  importFn: DynamicImport<P>,
  options: DynamicOptions<P> = {},
): ComponentType<P> {
  const LazyComponent = lazy(async () => {
    const mod = await importFn();
    if ('default' in mod) return mod as { default: ComponentType<P> };
    return { default: mod as ComponentType<P> };
  });

  const LoadingFallback = options.loading;

  function DynamicComponent(props: P) {
    return (
      <Suspense fallback={LoadingFallback ? <LoadingFallback /> : null}>
        <LazyComponent {...(props as P & object)} />
      </Suspense>
    );
  }

  DynamicComponent.displayName = 'DynamicComponent';
  return DynamicComponent;
}

export default dynamic;
