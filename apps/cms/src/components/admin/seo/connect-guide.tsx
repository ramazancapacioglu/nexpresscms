"use client";

import { useEffect, useState, useTransition } from "react";
import {
  BING_CNAME_TARGET,
  acceptVerifyCode,
  googleTxtValue,
  yandexTxtValue,
  type WebmasterVerification,
} from "@nexpress/core";
import { fieldClass } from "@/components/admin/appearance/appearance-ui";
import { checkWebmasterDnsAction } from "@/app/admin/seo/dns-check-action";
import { beginGoogleConnectAction } from "@/app/admin/seo/integrations/google-connect";

type Service = "gsc" | "ga4" | "bing" | "yandex";

const NOTES: Record<Service, { title: string; use: string; steps: string[] }> = {
  gsc: {
    title: "Google Search Console",
    use: "Bağlı kimlik sorgu, tıklama, gösterim ve sırayı çeker. Site sahipliği bundan ayrıdır: meta etiketi, DNS TXT kaydı ya da sitede duran Analytics etiketi ile doğrulanır.",
    steps: [
      "Google Cloud’da bir proje açın, Search Console API ve Analytics Data API’yi etkinleştirin.",
      "Kimlik bilgileri’nden Web uygulaması türünde bir OAuth istemcisi oluşturun.",
      "Yetkili yönlendirme adresine aşağıdaki callback adresini aynen ekleyin.",
      "İstemci kimliği ile sırrı kaydedin, sonra Google hesabıyla bağlanın. Yenileme jetonu panele yazılır.",
      "Mülk adresi, konsoldaki adresle aynı olmalı: https://www.site.com/ veya sc-domain:site.com.",
    ],
  },
  ga4: {
    title: "Google Analytics 4",
    use: "Ölçüm kimliği ziyaretçi sayfasına gtag etiketini basar. Sayısal mülk numarası rapor çeker ve Search Console ile aynı Google kimliğini kullanır.",
    steps: [
      "Analytics → Yönetici → Veri akışları → Web akışındaki ölçüm kimliğini (G-…) alın.",
      "Rapor için Yönetici → Mülk ayarları’ndaki sayısal mülk numarasını alın. G- kimliği bu alan değildir.",
      "Google Cloud’da Analytics Data API açık olmalı. Kimlik, Webmaster sekmesindeki Google bağlantısıdır.",
      "Tam gtag kodunu yapıştırmayın. Kimlik ve yer (head veya gövde sonu) yeter.",
      "Çerez onayı açıksa etiket, ziyaretçi kabul edene kadar yüklenmez.",
    ],
  },
  bing: {
    title: "Bing Webmaster",
    use: "API anahtarı sorgu istatistiğini çeker. Sahiplik meta etiketiyle head içine ya da CNAME kaydıyla doğrulanır. Bing TXT kaydı istemez.",
    steps: [
      "Bing Webmaster’da siteyi ekleyin. Doğrulama yönteminden HTML etiketinin content değerini ya da CNAME adını alın.",
      "API anahtarı: Ayarlar → API Erişimi. Anahtar siteye özeldir.",
      "Site adresi, Bing’de kayıtlı adresle aynı olmalıdır.",
    ],
  },
  yandex: {
    title: "Yandex Webmaster ve Metrika",
    use: "Webmaster sahipliği meta veya DNS TXT ile doğrulanır. Metrika sayaç numarası ölçüm betiğini basar; OAuth jetonu organik giriş raporunu çeker.",
    steps: [
      "Webmaster’da site ekleyin. Meta etiketinin content değerini ya da DNS TXT satırındaki kodu alın.",
      "Metrika’da sayaç açın. Ayarlardaki sayaç numarasını (yalnızca rakam) yazın. Sayaç kodunun tamamını yapıştırmayın.",
      "Jeton: oauth.yandex.com üzerinde Metrika okuma yetkili bir jeton alın ve parola alanına yapıştırın. Bu jeton, DNS kaydının yerine geçmez.",
    ],
  },
};

function Note({ service, redirectUri }: { service: Service; redirectUri: string }) {
  const note = NOTES[service];
  return (
    <aside className="rounded-lg border border-sky-500/25 bg-sky-500/5 p-3 text-[12px] leading-relaxed text-nx-soft">
      <p className="font-semibold text-nx-fg">{note.title}</p>
      <p className="mt-1">{note.use}</p>
      <ol className="mt-2 list-decimal space-y-1 pl-4">
        {note.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {service === "gsc" && redirectUri ? (
        <p className="mt-2 font-mono text-[11px] text-nx-fg">Yönlendirme adresi: {redirectUri}</p>
      ) : null}
    </aside>
  );
}

function CodeField({
  label,
  hint,
  value,
  onChange,
  preview,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (next: string) => void;
  preview?: string;
}) {
  return (
    <label className="block text-[11px] text-nx-soft">
      <span className="font-semibold text-nx-fg">{label}</span>
      <span className="mt-0.5 block">{hint}</span>
      <input
        className={`${fieldClass} mt-1 font-mono`}
        value={value}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Kod veya etiketin tamamı"
      />
      {preview ? <span className="mt-1 block font-mono text-[10px] text-nx-fg">{preview}</span> : null}
    </label>
  );
}

/**
 * Her entegrasyon sekmesinin bilgi kutusu ve sahiplik alanları.
 * Ham HTML saklanmaz; kayıt sırasında jeton ayıklanır.
 */
export function ConnectGuide({
  service,
  domain,
  verification,
  onVerification,
  gaPlacement,
  metrikaPlacement,
  onGaPlacement,
  onMetrikaPlacement,
  redirectUri: givenRedirectUri,
}: {
  service: Service;
  domain: string;
  verification: WebmasterVerification;
  onVerification: (next: WebmasterVerification) => void;
  gaPlacement: "head" | "body";
  metrikaPlacement: "head" | "body";
  onGaPlacement: (next: "head" | "body") => void;
  onMetrikaPlacement: (next: "head" | "body") => void;
  /** Google Cloud'a kaydedilecek yönlendirme adresi (sunucu kanonik adresten üretir) */
  redirectUri?: string;
}) {
  const [fallbackRedirect, setRedirectUri] = useState("");
  const redirectUri = givenRedirectUri || fallbackRedirect;
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    if (!givenRedirectUri) setRedirectUri(`${window.location.origin}/admin/seo/integrations/google/callback`);
  }, [givenRedirectUri]);
  const [pending, start] = useTransition();
  const patch = (partial: WebmasterVerification) => onVerification({ ...verification, ...partial });

  const check = (kind: "google" | "yandex" | "bing", code: string) => {
    start(async () => {
      const res = await checkWebmasterDnsAction({ kind, code });
      setNote(res.ok ? res.detail : res.error);
    });
  };

  const connect = () => {
    start(async () => {
      const res = await beginGoogleConnectAction();
      if (res && !res.ok) setNote(res.error);
    });
  };

  return (
    <div className="space-y-3">
      <Note service={service} redirectUri={redirectUri} />
      {service === "gsc" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <CodeField
            label="Google meta (head)"
            hint="Search Console HTML etiketi. content değeri head içine yazılır."
            value={verification.google ?? ""}
            onChange={(google) => patch({ google })}
            preview={verification.google ? `<meta name="google-site-verification" content="…">` : undefined}
          />
          <div className="space-y-2">
            <CodeField
              label="Google DNS TXT"
              hint={`Kök ada (@) ekleyin. Sorgulanan ad: ${domain || "site alan adı"}.`}
              value={verification.dns?.google ?? ""}
              onChange={(google) => patch({ dns: { ...verification.dns, google } })}
              preview={acceptVerifyCode(verification.dns?.google) ? googleTxtValue(acceptVerifyCode(verification.dns?.google)) : undefined}
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => check("google", verification.dns?.google ?? "")}
              className="rounded-md border border-nx-line px-2.5 py-1 text-[11px] font-semibold"
            >
              {pending ? "Sorgulanıyor…" : "TXT kaydını kontrol et"}
            </button>
          </div>
          <div className="md:col-span-2">
            <button
              type="button"
              disabled={pending}
              onClick={connect}
              className="rounded-lg bg-nx-subtle px-3 py-1.5 text-xs font-semibold text-nx-fg"
            >
              Google hesabıyla bağlan
            </button>
            <p className="mt-1 text-[11px] text-nx-soft">Önce istemci kimliğini kaydedin. Aynı kimlik Analytics raporunu da açar.</p>
          </div>
        </div>
      ) : null}

      {service === "ga4" ? (
        <label className="block text-[11px] text-nx-soft">
          Ölçüm etiketinin yeri
          <select className={`${fieldClass} mt-1`} value={gaPlacement} onChange={(e) => onGaPlacement(e.target.value === "body" ? "body" : "head")}>
            <option value="head">Head — sayfanın başı</option>
            <option value="body">Gövde sonu</option>
          </select>
        </label>
      ) : null}

      {service === "bing" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <CodeField
            label="Bing meta (head)"
            hint="msvalidate.01 etiketinin content değeri."
            value={verification.bing ?? ""}
            onChange={(bing) => patch({ bing })}
            preview={verification.bing ? `<meta name="msvalidate.01" content="…">` : undefined}
          />
          <div className="space-y-2">
            <CodeField
              label="Bing CNAME adı"
              hint={`Hedef her zaman ${BING_CNAME_TARGET}. Yalnızca Bing’in verdiği ad yazılır.`}
              value={verification.bingCname ?? ""}
              onChange={(bingCname) => patch({ bingCname })}
              preview={verification.bingCname ? `${verification.bingCname}.${domain || "alan"} → ${BING_CNAME_TARGET}` : undefined}
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => check("bing", verification.bingCname ?? "")}
              className="rounded-md border border-nx-line px-2.5 py-1 text-[11px] font-semibold"
            >
              {pending ? "Sorgulanıyor…" : "CNAME kaydını kontrol et"}
            </button>
          </div>
        </div>
      ) : null}

      {service === "yandex" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <CodeField
            label="Yandex Webmaster meta (head)"
            hint="yandex-verification etiketinin content değeri."
            value={verification.yandex ?? ""}
            onChange={(yandex) => patch({ yandex })}
          />
          <div className="space-y-2">
            <CodeField
              label="Yandex DNS TXT"
              hint="Kök ada (@) eklenen TXT kaydı. Değeri aşağıda üretilir."
              value={verification.dns?.yandex ?? ""}
              onChange={(yandex) => patch({ dns: { ...verification.dns, yandex } })}
              preview={acceptVerifyCode(verification.dns?.yandex) ? yandexTxtValue(acceptVerifyCode(verification.dns?.yandex)) : undefined}
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => check("yandex", verification.dns?.yandex ?? "")}
              className="rounded-md border border-nx-line px-2.5 py-1 text-[11px] font-semibold"
            >
              {pending ? "Sorgulanıyor…" : "TXT kaydını kontrol et"}
            </button>
          </div>
          <label className="block text-[11px] text-nx-soft md:col-span-2">
            Metrika sayaç yeri
            <select
              className={`${fieldClass} mt-1`}
              value={metrikaPlacement}
              onChange={(e) => onMetrikaPlacement(e.target.value === "body" ? "body" : "head")}
            >
              <option value="head">Head — sayfanın başı</option>
              <option value="body">Gövde sonu</option>
            </select>
          </label>
        </div>
      ) : null}

      {note ? <p className="text-[11px] text-nx-fg">{note}</p> : null}
    </div>
  );
}
