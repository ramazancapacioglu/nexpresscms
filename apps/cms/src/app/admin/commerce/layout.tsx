"use client";

import { usePathname } from "next/navigation";
import { CommerceNav } from "@/components/admin/commerce/commerce-nav";

export default function AdminCommerceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div>
      <CommerceNav pathname={pathname} />
      {children}
    </div>
  );
}
