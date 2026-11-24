import React from "react";
import type { DesignTokens } from "@nexpress/core";

interface KdvCalcProps {
  id: string;
  title?: string;
  subtitle?: string;
  defaultRate?: number;
  tevkifatLimit?: number;
  tokens: DesignTokens;
}

/**
 * 0-KB React istemci paketiyle çalışan canlı KDV ve Tevkifat Hesaplama Aracı (RSC + saf satır içi betik).
 * 5 hesaplama modu (KDV Hariç, KDV Dahil, KDV Tutarı, Tevkifat Tutarı, Genel Toplam),
 * %1 / %10 / %20 + özel oran, 2/10..10/10 tevkifat ve 2026 12.000 TL tevkifat eşiği uyarısı içerir.
 */
export function KdvCalculatorBlock({
  id,
  title = "KDV ve Tevkifat Hesaplama Aracı",
  subtitle = "KDV hariç, KDV dahil, KDV tutarı, tevkifat veya genel toplam üzerinden 2026 güncel oranlarıyla anında hesaplayın.",
  defaultRate = 20,
  tevkifatLimit = 12000,
  tokens,
}: KdvCalcProps) {
  const safeId = `nx_kdv_${id.replace(/[^a-zA-Z0-9_]/g, "")}`;
  const initRate = [1, 10, 20].includes(defaultRate) ? defaultRate : 20;

  const inlineScript = `(function(){
  var root = document.getElementById(${JSON.stringify(safeId)});
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  var limit = ${Number(tevkifatLimit) || 12000};
  var state = { mode: "excl", rate: ${initRate}, tevkifatOn: false, tevkifatNum: 5 };
  var amountEl = root.querySelector("[data-kdv-amount]");
  var customRateEl = root.querySelector("[data-kdv-custom-rate]");
  var tevkifatToggle = root.querySelector("[data-kdv-tevkifat-toggle]");
  var tevkifatBox = root.querySelector("[data-kdv-tevkifat-box]");
  var limitHint = root.querySelector("[data-kdv-limit-hint]");
  var copyBtn = root.querySelector("[data-kdv-copy]");
  var clearBtn = root.querySelector("[data-kdv-clear]");

  function parseAmt(v) {
    var s = String(v || "").trim().replace(/[^0-9.,]/g, "");
    if (!s) return 0;
    if (s.indexOf(",") !== -1 && s.indexOf(".") !== -1) {
      s = s.replace(/\\./g, "").replace(",", ".");
    } else if (s.indexOf(",") !== -1) {
      s = s.replace(",", ".");
    }
    var n = parseFloat(s);
    return isFinite(n) && n > 0 ? n : 0;
  }

  var fmt = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function money(n) { return "₺" + fmt.format(isFinite(n) ? n : 0); }

  function setActive(selector, attr, val) {
    var btns = root.querySelectorAll(selector);
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute(attr) === String(val);
      btns[i].setAttribute("aria-pressed", on ? "true" : "false");
      btns[i].style.backgroundColor = on ? ${JSON.stringify(tokens.colors.primary)} : "";
      btns[i].style.color = on ? ${JSON.stringify(tokens.colors.primaryForeground)} : "";
      btns[i].style.borderColor = on ? ${JSON.stringify(tokens.colors.primary)} : "";
    }
  }

  function calc() {
    var input = parseAmt(amountEl.value);
    var r = (parseFloat(state.rate) || 0) / 100;
    var tRatio = state.tevkifatOn ? (state.tevkifatNum / 10) : 0;
    var base = 0, vat = 0, tevkifat = 0, incl = 0, grand = 0;

    if (input > 0) {
      if (state.mode === "excl") {
        base = input;
        vat = base * r;
      } else if (state.mode === "incl") {
        base = r > 0 ? input / (1 + r) : input;
        vat = input - base;
      } else if (state.mode === "tax") {
        vat = input;
        base = r > 0 ? vat / r : 0;
      } else if (state.mode === "tevkifat") {
        var effT = tRatio > 0 ? tRatio : 0.5;
        tevkifat = input;
        vat = effT > 0 ? tevkifat / effT : 0;
        base = r > 0 ? vat / r : 0;
      } else if (state.mode === "grand") {
        var mult = 1 + r * (1 - tRatio);
        base = mult > 0 ? input / mult : input;
        vat = base * r;
      }
      tevkifat = state.mode === "tevkifat" ? input : vat * tRatio;
      incl = base + vat;
      grand = incl - tevkifat;
    }

    var sellerVat = Math.max(0, vat - tevkifat);
    root.querySelector("[data-out-base]").textContent = money(base);
    root.querySelector("[data-out-vat]").textContent = money(vat);
    root.querySelector("[data-out-tevkifat]").textContent = money(tevkifat);
    root.querySelector("[data-out-seller-vat]").textContent = money(sellerVat);
    root.querySelector("[data-out-incl]").textContent = money(incl);
    root.querySelector("[data-out-grand]").textContent = money(grand);
    root.querySelector("[data-out-rate-lbl]").textContent = "%" + state.rate;
    root.querySelector("[data-out-tevkifat-lbl]").textContent = state.tevkifatOn ? (state.tevkifatNum + "/10") : "Yok";

    if (limitHint) {
      if (state.tevkifatOn && incl > 0 && incl <= limit && state.tevkifatNum < 10) {
        limitHint.style.display = "block";
      } else {
        limitHint.style.display = "none";
      }
    }
  }

  root.addEventListener("click", function(e) {
    var modeBtn = e.target.closest("[data-kdv-mode]");
    if (modeBtn) {
      state.mode = modeBtn.getAttribute("data-kdv-mode");
      if (state.mode === "tevkifat" && !state.tevkifatOn) {
        state.tevkifatOn = true;
        tevkifatToggle.checked = true;
        tevkifatBox.style.display = "block";
      }
      setActive("[data-kdv-mode]", "data-kdv-mode", state.mode);
      calc();
      return;
    }
    var rateBtn = e.target.closest("[data-kdv-rate]");
    if (rateBtn) {
      state.rate = parseFloat(rateBtn.getAttribute("data-kdv-rate")) || 20;
      if (customRateEl) customRateEl.value = "";
      setActive("[data-kdv-rate]", "data-kdv-rate", state.rate);
      calc();
      return;
    }
    var tevBtn = e.target.closest("[data-kdv-tev]");
    if (tevBtn) {
      state.tevkifatNum = parseInt(tevBtn.getAttribute("data-kdv-tev"), 10) || 5;
      setActive("[data-kdv-tev]", "data-kdv-tev", state.tevkifatNum);
      calc();
      return;
    }
  });

  amountEl.addEventListener("input", calc);
  if (customRateEl) {
    customRateEl.addEventListener("input", function() {
      var v = parseFloat(String(customRateEl.value).replace(",", "."));
      if (isFinite(v) && v >= 0 && v <= 100) {
        state.rate = v;
        setActive("[data-kdv-rate]", "data-kdv-rate", -1);
        calc();
      }
    });
  }
  tevkifatToggle.addEventListener("change", function() {
    state.tevkifatOn = tevkifatToggle.checked;
    tevkifatBox.style.display = state.tevkifatOn ? "block" : "none";
    calc();
  });
  if (clearBtn) {
    clearBtn.addEventListener("click", function() {
      amountEl.value = "";
      amountEl.focus();
      calc();
    });
  }
  if (copyBtn) {
    copyBtn.addEventListener("click", function() {
      var summary = [
        "KDV Hesaplama Özeti (akinsoftizmir.com.tr)",
        "Matrah (KDV Hariç): " + root.querySelector("[data-out-base]").textContent,
        "Hesaplanan KDV (" + root.querySelector("[data-out-rate-lbl]").textContent + "): " + root.querySelector("[data-out-vat]").textContent,
        "Tevkifat (" + root.querySelector("[data-out-tevkifat-lbl]").textContent + "): " + root.querySelector("[data-out-tevkifat]").textContent,
        "KDV Dahil Toplam: " + root.querySelector("[data-out-incl]").textContent,
        "Ödenecek Genel Toplam: " + root.querySelector("[data-out-grand]").textContent
      ].join("\\n");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(summary).then(function() {
          var old = copyBtn.textContent;
          copyBtn.textContent = "Kopyalandı ✓";
          setTimeout(function() { copyBtn.textContent = old; }, 1800);
        });
      }
    });
  }

  setActive("[data-kdv-mode]", "data-kdv-mode", state.mode);
  setActive("[data-kdv-rate]", "data-kdv-rate", state.rate);
  setActive("[data-kdv-tev]", "data-kdv-tev", state.tevkifatNum);
  calc();
})();`;

  return (
    <section
      id={safeId}
      style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
      className="border bg-nx-card p-5 sm:p-7 shadow-sm space-y-6"
    >
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            style={{ backgroundColor: tokens.colors.primary, color: tokens.colors.primaryForeground }}
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          >
            2026 Güncel KDV & Tevkifat
          </span>
          <span className="text-xs text-nx-muted">Anlık Hesaplama · 0 ms Gecikme</span>
        </div>
        <h2 style={{ fontFamily: tokens.typography.headingFont }} className="text-xl sm:text-2xl font-bold text-nx-fg">
          {title}
        </h2>
        {subtitle ? <p className="text-sm text-nx-soft max-w-3xl">{subtitle}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Sol: Giriş & Seçenekler */}
        <div className="lg:col-span-7 space-y-5">
          {/* Tutar Girişi */}
          <div className="space-y-2">
            <label htmlFor={`${safeId}_amt`} className="block text-xs font-semibold uppercase tracking-wider text-nx-muted">
              Tutar (TL)
            </label>
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3.5 text-base font-bold text-nx-muted">₺</span>
              <input
                id={`${safeId}_amt`}
                data-kdv-amount=""
                type="text"
                inputMode="decimal"
                defaultValue="10000"
                placeholder="Örn: 15.000,00"
                style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
                className="h-12 w-full border bg-nx-bg pl-9 pr-10 text-lg font-bold text-nx-fg outline-none focus:ring-2 focus:ring-sky-500/30"
              />
              <button
                type="button"
                data-kdv-clear=""
                aria-label="Tutarı temizle"
                className="absolute right-2.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-sm text-nx-muted hover:bg-black/5 hover:text-nx-fg"
              >
                ×
              </button>
            </div>
          </div>

          {/* 5 Hesaplama Modu */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-nx-muted">
              Hesaplama Türü
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                { key: "excl", label: "KDV Hariçten" },
                { key: "incl", label: "KDV Dahilden" },
                { key: "tax", label: "KDV Tutarından" },
                { key: "tevkifat", label: "Tevkifat Tutarından" },
                { key: "grand", label: "Genel Toplamdan" },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  data-kdv-mode={m.key}
                  style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
                  className="cursor-pointer border bg-nx-subtle/50 px-3 py-2 text-xs font-semibold text-nx-fg transition hover:bg-nx-subtle"
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* KDV Oranı */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-nx-muted">
              KDV Oranı (%)
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {[1, 10, 20].map((r) => (
                <button
                  key={r}
                  type="button"
                  data-kdv-rate={String(r)}
                  style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
                  className="min-w-[72px] cursor-pointer border bg-nx-subtle/50 px-4 py-2 text-sm font-bold text-nx-fg transition hover:bg-nx-subtle"
                >
                  %{r}
                </button>
              ))}
              <div className="flex items-center gap-1.5">
                <input
                  data-kdv-custom-rate=""
                  type="number"
                  min={0}
                  max={100}
                  step="0.5"
                  placeholder="Özel %"
                  aria-label="Özel KDV oranı"
                  style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
                  className="h-10 w-24 border bg-nx-bg px-3 text-sm font-semibold text-nx-fg outline-none focus:ring-2 focus:ring-sky-500/30"
                />
              </div>
            </div>
          </div>

          {/* Tevkifat Seçeneği */}
          <div
            style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
            className="border bg-nx-subtle/40 p-4 space-y-3"
          >
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-nx-fg">KDV Tevkifatı Uygula</div>
                <div className="text-xs text-nx-muted">2026 kısmi tevkifat alt sınırı: KDV dahil {tevkifatLimit.toLocaleString("tr-TR")} TL</div>
              </div>
              <input
                type="checkbox"
                data-kdv-tevkifat-toggle=""
                className="h-5 w-5 cursor-pointer accent-sky-600"
              />
            </label>

            <div data-kdv-tevkifat-box="" style={{ display: "none" }} className="space-y-3 pt-1">
              <div className="flex flex-wrap gap-2">
                {[2, 3, 4, 5, 7, 9, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    data-kdv-tev={String(n)}
                    style={{ borderRadius: tokens.geometry.borderRadius, borderColor: tokens.colors.border }}
                    className="cursor-pointer border bg-nx-card px-3 py-1.5 text-xs font-bold text-nx-fg transition hover:bg-nx-subtle"
                  >
                    {n}/10
                  </button>
                ))}
              </div>
              <p
                data-kdv-limit-hint=""
                style={{ display: "none" }}
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-800"
              >
                Bilgi: 2026 yılında kısmi KDV tevkifatı alt sınırı KDV dahil {tevkifatLimit.toLocaleString("tr-TR")} TL&apos;dir. Bu tutarın altındaki faturalarda kısmi tevkifat zorunlu değildir.
              </p>
            </div>
          </div>
        </div>

        {/* Sağ: Canlı Sonuç Kartı */}
        <div
          style={{ borderRadius: tokens.geometry.borderRadius }}
          className="lg:col-span-5 flex flex-col justify-between bg-slate-950 p-6 text-white shadow-md space-y-5"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hesaplama Özeti</span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300">
                KDV <span data-out-rate-lbl="">%{initRate}</span> · Tevkifat <span data-out-tevkifat-lbl="">Yok</span>
              </span>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-300">Matrah (KDV Hariç)</dt>
                <dd data-out-base="" className="font-mono font-semibold text-white">₺10.000,00</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-300">Hesaplanan KDV</dt>
                <dd data-out-vat="" className="font-mono font-semibold text-sky-300">₺2.000,00</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-300">Tevkifat (Alıcı — KDV 2)</dt>
                <dd data-out-tevkifat="" className="font-mono font-semibold text-amber-300">₺0,00</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-300">Satıcıya Kalan KDV (KDV 1)</dt>
                <dd data-out-seller-vat="" className="font-mono font-semibold text-slate-200">₺2.000,00</dd>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                <dt className="text-slate-300">KDV Dahil Toplam</dt>
                <dd data-out-incl="" className="font-mono font-semibold text-white">₺12.000,00</dd>
              </div>
            </dl>

            <div className="rounded-xl bg-white/10 p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Ödenecek Genel Toplam</div>
                <div className="text-[11px] text-slate-400">Fatura net tahsilat tutarı</div>
              </div>
              <div data-out-grand="" className="font-mono text-2xl font-extrabold tracking-tight text-emerald-400">
                ₺12.000,00
              </div>
            </div>
          </div>

          <button
            type="button"
            data-kdv-copy=""
            style={{ borderRadius: tokens.geometry.borderRadius }}
            className="w-full cursor-pointer border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20"
          >
            Hesaplama Özetini Kopyala
          </button>
        </div>
      </div>

      {/* eslint-disable-next-line react/no-danger */}
      <script dangerouslySetInnerHTML={{ __html: inlineScript }} />
    </section>
  );
}
