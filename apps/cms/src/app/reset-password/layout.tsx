import "@/app/admin.css";
import { ThemeBoundary } from "@/components/admin/theme-boundary";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ThemeBoundary>{children}</ThemeBoundary>;
}
