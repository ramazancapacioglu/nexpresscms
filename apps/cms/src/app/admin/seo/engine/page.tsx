import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Geriye dönük uyum: Arama dizini artık Şemalar & Dizin sekmesinin içindedir. */
export default function AdminSeoEnginePage() {
  redirect("/admin/seo/schemas#arama-dizini");
}
