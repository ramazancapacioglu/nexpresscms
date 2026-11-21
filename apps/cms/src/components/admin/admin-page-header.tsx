import React from "react";

export interface AdminPageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Tüm yönetim paneli sayfaları için tek tip üst başlık çerçevesi.
 * Başlık, kısa açıklama, isteğe bağlı durum rozeti ve sağ aksiyon çubuğu.
 */
export function AdminPageHeader({
  title,
  description,
  badge,
  actions,
}: AdminPageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-[#E6E7EA] pb-3.5 dark:border-[#23262E] sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">
            {title}
          </h1>
          {badge}
        </div>
        {description ? (
          <p className="text-[12px] leading-relaxed text-[#5F6570] dark:text-[#8C9099]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
