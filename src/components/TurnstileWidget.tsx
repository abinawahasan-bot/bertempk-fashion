import { useEffect, useRef } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

interface TurnstileWidgetProps {
  onToken: (token: string) => void;
  onExpire?: () => void;
}

/**
 * Cloudflare Turnstile widget. Renders only when `VITE_TURNSTILE_SITE_KEY` is
 * set; otherwise renders nothing (graceful degradation). The widget calls
 * `onToken` with a verification token that must be sent to the server for
 * validation.
 */
export default function TurnstileWidget({ onToken, onExpire }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return;

    const render = () => {
      if (!containerRef.current || widgetIdRef.current) return;
      const turnstile = (window as any).turnstile;
      if (!turnstile) return;
      widgetIdRef.current = turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => onToken(token),
        "expired-callback": () => onExpire?.(),
        "error-callback": () => onExpire?.(),
      });
    };

    // Turnstile script may still be loading.
    if ((window as any).turnstile) {
      render();
    } else {
      const interval = setInterval(() => {
        if ((window as any).turnstile) {
          clearInterval(interval);
          render();
        }
      }, 100);
      return () => clearInterval(interval);
    }

    return () => {
      if (widgetIdRef.current && (window as any).turnstile) {
        (window as any).turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onToken, onExpire]);

  if (!SITE_KEY) return null;

  return <div ref={containerRef} className="mt-4" />;
}
