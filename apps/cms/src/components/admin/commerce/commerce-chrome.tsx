"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { CommerceNav } from "./commerce-nav";

/** E-ticaret alt menüsü. Pazar yeri bu çubukta durmaz. */
export function CommerceChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div>
      <CommerceNav pathname={pathname} />
      {children}
    </div>
  );
}
