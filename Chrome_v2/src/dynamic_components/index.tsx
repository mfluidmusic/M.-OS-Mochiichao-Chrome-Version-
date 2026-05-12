import { Suspense, useMemo } from 'react';

// @ts-ignore
const modules = import.meta.glob('./*.tsx', { eager: true });

export function DynamicComponentRegistry() {
  const components = useMemo(() => {
    const list: React.FC[] = [];
    for (const path in modules) {
      if (path === './index.tsx') continue;
      
      const mod = modules[path] as any;
      // We look for a default export
      if (mod && mod.default) {
        list.push(mod.default);
      } else if (mod) {
         // Also check for named exports
         for (const key in mod) {
             if (typeof mod[key] === 'function') {
                 list.push(mod[key]);
                 break;
             }
         }
      }
    }
    return list;
  }, []);

  return (
    <>
       {components.map((Component, i) => (
          <Suspense fallback={null} key={i}>
             <Component />
          </Suspense>
       ))}
    </>
  );
}
