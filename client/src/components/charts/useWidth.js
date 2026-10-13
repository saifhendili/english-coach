import { useEffect, useState } from 'react';

// The width of an element, kept up to date, so an SVG can be drawn at its real pixel size
// (crisp 1px hairlines and fixed-size marks instead of a stretched picture).
// Use it as a callback ref: `const [ref, width] = useWidth(); <div ref={ref}>`. The element can come and go
// (a chart swapped for its table and back): the observer follows whichever element is current, and a hidden
// element reporting zero width is ignored instead of shrinking the chart.
export function useWidth(initial = 320) {
  const [node, setNode] = useState(null);
  const [width, setWidth] = useState(initial);

  useEffect(() => {
    if (!node) return undefined;
    const update = () => {
      const w = Math.round(node.getBoundingClientRect().width);
      if (w > 0) setWidth(Math.max(200, w));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return [setNode, width];
}
