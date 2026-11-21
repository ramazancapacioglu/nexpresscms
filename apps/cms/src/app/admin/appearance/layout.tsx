import React from "react";
import { AppearanceNav } from "@/components/admin/section-tabs";

export default function AppearanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <AppearanceNav />
      {children}
    </div>
  );
}
