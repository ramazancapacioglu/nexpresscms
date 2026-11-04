"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * AdminProgressBar: Admin içi sayfa geçişlerinde anında görsel geri bildirim sağlayan
 * 0-gecikmeli üst ilerleme çubuğu. Tıklama anında devreye girer, yeni rota render edildiğinde tamamlanır.
 */
export function AdminProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Rota değiştiğinde barı %100 yapıp pürüzsüzce kaybet
    if (active) {
      setProgress(100);
      const timer = setTimeout(() => {
        setActive(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Dış bağlantılar, yeni sekme, dosya indirme veya değiştirici tuşlarla (cmd/ctrl) açılanları yoksay
      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      // Aynı sayfaya tıklanmışsa bar başlatma
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl) return;

      // Anında başlat
      setActive(true);
      setProgress(25);

      const t1 = setTimeout(() => setProgress(55), 100);
      const t2 = setTimeout(() => setProgress(80), 300);
      const t3 = setTimeout(() => setProgress(92), 700);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  if (!active && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 inset-x-0 z-[9999] h-0.5 bg-transparent overflow-hidden"
    >
      <div
        className="h-full bg-blue-600 dark:bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.7)]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition:
            progress === 100
              ? "width 150ms ease-out, opacity 250ms ease-out 100ms"
              : "width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
}

