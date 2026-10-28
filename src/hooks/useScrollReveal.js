import { useEffect, useRef, useState } from 'react';

/**
 * useScrollReveal(ref, options)
 *
 * Watches `ref` with IntersectionObserver.
 * Returns `true` when the element is in view.
 *
 * once: false  → re-hides on scroll-back (allows animation replay)
 * once: true   → stays visible after first intersection
 */
export function useScrollReveal(ref, { threshold = 0.2, once = false } = {}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref?.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold, once]);

  return visible;
}
