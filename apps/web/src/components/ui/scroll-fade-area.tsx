"use client";

import * as React from "react";
import { cn } from "~/lib/utils";

interface ScrollFadeAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  fadeHeight?: number;
  containerClassName?: string;
  scrollClassName?: string;
  showOverlay?: boolean;
}

export const ScrollFadeArea = React.forwardRef<HTMLDivElement, ScrollFadeAreaProps>(
  (
    {
      children,
      fadeHeight = 32,
      containerClassName,
      scrollClassName,
      showOverlay = true,
      className,
      style,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = React.useRef<HTMLDivElement | null>(null);
    const [canScrollTop, setCanScrollTop] = React.useState(false);
    const [canScrollBottom, setCanScrollBottom] = React.useState(false);

    const setRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        internalRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [forwardedRef]
    );

    const updateScroll = React.useCallback(() => {
      const el = internalRef.current;
      if (!el) return;

      const hasOverflow = el.scrollHeight > el.clientHeight + 2;
      if (!hasOverflow) {
        setCanScrollTop(false);
        setCanScrollBottom(false);
        return;
      }

      const isTop = el.scrollTop <= 2;
      const isBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;

      setCanScrollTop(!isTop);
      setCanScrollBottom(!isBottom);
    }, []);

    React.useEffect(() => {
      const el = internalRef.current;
      if (!el) return;

      updateScroll();

      const resizeObserver = new ResizeObserver(() => {
        updateScroll();
      });
      resizeObserver.observe(el);

      const mutationObserver = new MutationObserver(() => {
        updateScroll();
      });
      mutationObserver.observe(el, { childList: true, subtree: true });

      return () => {
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };
    }, [updateScroll]);

    const maskStyle = React.useMemo(() => {
      if (!canScrollTop && !canScrollBottom) return "none";
      if (canScrollTop && canScrollBottom) {
        return `linear-gradient(to bottom, transparent 0px, black ${fadeHeight}px, black calc(100% - ${fadeHeight}px), transparent 100%)`;
      }
      if (canScrollTop && !canScrollBottom) {
        return `linear-gradient(to bottom, transparent 0px, black ${fadeHeight}px, black 100%)`;
      }
      return `linear-gradient(to bottom, black 0px, black calc(100% - ${fadeHeight}px), transparent 100%)`;
    }, [canScrollTop, canScrollBottom, fadeHeight]);

    return (
      <div className={cn("relative overflow-hidden", containerClassName)}>
        {/* Top blur & gradient fade */}
        {showOverlay && (
          <div
            data-scroll-overlay="true"
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 z-10 transition-opacity duration-200",
              canScrollTop ? "opacity-100" : "opacity-0"
            )}
            style={{ height: `${fadeHeight}px` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-card via-card/75 to-transparent backdrop-blur-[2px]" />
          </div>
        )}

        {/* Scrollable Container */}
        <div
          ref={setRef}
          onScroll={updateScroll}
          data-scroll-fade="true"
          style={{
            WebkitMaskImage: maskStyle,
            maskImage: maskStyle,
            ...style,
          }}
          className={cn("overflow-y-auto", scrollClassName, className)}
          {...props}
        >
          {children}
        </div>

        {/* Bottom blur & gradient fade */}
        {showOverlay && (
          <div
            data-scroll-overlay="true"
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 z-10 transition-opacity duration-200",
              canScrollBottom ? "opacity-100" : "opacity-0"
            )}
            style={{ height: `${fadeHeight}px` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/75 to-transparent backdrop-blur-[2px]" />
          </div>
        )}
      </div>
    );
  }
);

ScrollFadeArea.displayName = "ScrollFadeArea";
