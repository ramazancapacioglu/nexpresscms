import "@/app/admin.css";
import { ThemeBoundary } from "@/components/admin/theme-boundary";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <ThemeBoundary>{children}</ThemeBoundary>;
}
