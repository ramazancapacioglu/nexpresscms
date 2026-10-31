// Kimlik akışları uçtan uca testi (playwright-core): davet, parola belirleme, tek kullanımlık bağlantı,
// unuttum yanıtının hesap varlığını sızdırmaması, 2FA kurulumu/girişi/yeniden kullanım/kurtarma kodu/kapatma.
// Çalışan bir uygulamaya karşı koşar; SMTP gerekmez (davet bağlantısı yöneticiye gösterilir).
//   AUTH_E2E_BASE_URL (varsayılan http://localhost:3000)  AUTH_E2E_EMAIL / AUTH_E2E_PASSWORD (yönetici)  AUTH_E2E_CHROME (isteğe bağlı)
// Çıkış kodu 1: herhangi bir doğrulama başarısız.
import { createHmac } from "node:crypto";
import { chromium } from "playwright-core";

const BASE = (process.env.AUTH_E2E_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const ADMIN = { email: process.env.AUTH_E2E_EMAIL, password: process.env.AUTH_E2E_PASSWORD };
if (!ADMIN.email || !ADMIN.password) {
  console.error("AUTH_E2E_EMAIL ve AUTH_E2E_PASSWORD gerekli.");
  process.exit(2);
}
const RUN = Date.now().toString(36);
const INVITEE = `davet-${RUN}@example.test`;
const PASSWORD = "Yeni-Parola-2026-kZ9!x";

// RFC 6238 (SHA-1, 6 hane, 30 sn) — uygulamadaki uygulamadan bağımsız ikinci bir gerçekleme
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function b32decode(s) {
  let bits = 0, val = 0; const out = [];
  for (const ch of s.replace(/[\s=]/g, "").toUpperCase()) {
    val = (val << 5) | B32.indexOf(ch); bits += 5;
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}
function totp(secret, step) {
  const c = Buffer.alloc(8); c.writeBigUInt64BE(BigInt(step));
  const h = createHmac("sha1", b32decode(secret)).update(c).digest();
  const o = h[h.length - 1] & 15;
  return String((((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1_000_000).padStart(6, "0");
}
const nowStep = () => Math.floor(Date.now() / 30000);

let failed = 0;
const ok = (cond, msg) => { console.log(`${cond ? "OK  " : "FAIL"} ${msg}`); if (!cond) failed++; };

const browser = await chromium.launch({ executablePath: process.env.AUTH_E2E_CHROME || undefined, args: ["--no-sandbox"] });
const fresh = async () => (await browser.newContext()).newPage();
const login = async (page, email, password) => {
  await page.goto(`${BASE}/login`);
  await page.fill("input[type=email]", email);
  await page.fill("input[type=password]", password);
  await page.click("button[type=submit]");
};
// Önceki hata iletisi ekranda kalabilir: beklenen metni içeren uyarı görünene kadar bekler
const hasAlert = async (page, part) => page.waitForSelector(`p[role=alert]:has-text("${part}")`, { timeout: 15000 }).then(() => true, () => false);

try {
  // --- Yönetici davet eder (SMTP yok: bağlantı yöneticiye gösterilir) ---
  const admin = await fresh();
  await login(admin, ADMIN.email, ADMIN.password);
  await admin.waitForURL(/\/admin/);
  await admin.goto(`${BASE}/admin/users`);
  await admin.fill('input[aria-label="E-posta"]', INVITEE);
  await admin.fill('input[aria-label="Ad"]', "Davetli Test");
  await admin.click('button:has-text("Davet gönder")');
  const linkInput = await admin.waitForSelector('input[aria-label="Bağlantı"]', { timeout: 20000 }).catch(() => null);
  ok(!!linkInput, "davet bağlantısı yöneticiye gösterildi");
  const invite = linkInput ? await linkInput.inputValue() : "";
  ok(/reset-password\?t=invite\./.test(decodeURIComponent(invite)), "davet belirteci biçimi");

  // --- Davetli parola belirler ---
  const invitee = await fresh();
  await invitee.goto(invite);
  ok((await invitee.locator("h1").innerText()) === "Hesabınızı etkinleştirin", "davet sayfası açıldı");
  await invitee.fill("input[name=password]", PASSWORD);
  await invitee.fill("input[name=confirm]", `${PASSWORD}x`);
  await invitee.click("button[type=submit]");
  ok(await hasAlert(invitee, "eşleşmiyor"), "eşleşmeyen parola reddedildi");
  await invitee.fill("input[name=password]", `davet-${RUN}-Zq9!-2026`);
  await invitee.fill("input[name=confirm]", `davet-${RUN}-Zq9!-2026`);
  await invitee.click("button[type=submit]");
  ok(await hasAlert(invitee, "içermemeli"), "e-posta yerel kısmını içeren parola reddedildi");
  await invitee.fill("input[name=password]", PASSWORD);
  await invitee.fill("input[name=confirm]", PASSWORD);
  await Promise.all([invitee.waitForURL(/\/admin/), invitee.click("button[type=submit]")]);
  ok(true, "parola belirlendi ve oturum açıldı");

  const reuse = await fresh();
  await reuse.goto(invite);
  ok((await reuse.locator("h1").innerText()) === "Bağlantı geçerli değil", "kullanılmış davet bağlantısı geçersiz");
  const tampered = await fresh();
  await tampered.goto(`${invite.slice(0, -3)}abc`);
  ok((await tampered.locator("h1").innerText()) === "Bağlantı geçerli değil", "kurcalanmış belirteç reddedildi");

  // --- Unuttum: kayıtlı ve kayıtsız e-posta aynı yanıtı verir ---
  const forgot = await fresh();
  const answers = [];
  for (const email of [INVITEE, `yok-${RUN}@example.test`]) {
    await forgot.goto(`${BASE}/forgot-password`);
    await forgot.fill("input[name=email]", email);
    await forgot.click("button[type=submit]");
    answers.push(await (await forgot.waitForSelector("p[role=status]")).innerText());
  }
  ok(answers[0] === answers[1], "unuttum yanıtı hesap varlığını sızdırmıyor");

  // --- Yanlış parola ---
  const bad = await fresh();
  await login(bad, INVITEE, "Yanlis-Parola-2026!q");
  ok(await hasAlert(bad, "hatalı"), "yanlış parola genel hata verir");

  // --- 2FA kurulumu (davetli kullanıcıda; yönetici hesabına dokunulmaz) ---
  await invitee.goto(`${BASE}/admin/profile`);
  await invitee.click('button:has-text("Kur")');
  await invitee.fill("input[type=password] >> nth=-1", PASSWORD);
  await invitee.click('button:has-text("Devam")');
  const secret = (await (await invitee.waitForSelector('code[aria-label="Kurulum anahtarı"]')).innerText()).trim();
  await invitee.fill("input[autocomplete=one-time-code]", "000000");
  await invitee.click('button:has-text("Doğrula ve aç")');
  ok(await hasAlert(invitee, "hatalı"), "yanlış kurulum kodu reddedildi");
  const setupStep = nowStep();
  await invitee.fill("input[autocomplete=one-time-code]", totp(secret, setupStep));
  await invitee.click('button:has-text("Doğrula ve aç")');
  await invitee.waitForSelector("ul.font-mono li");
  const codes = (await invitee.locator("ul.font-mono li").allInnerTexts()).map((c) => c.trim());
  ok(codes.length === 10, "10 kurtarma kodu gösterildi");

  // --- Parola tek başına yetmez ---
  const second = await fresh();
  await login(second, INVITEE, PASSWORD);
  await second.waitForURL(/login\/verify/);
  ok(true, "parola sonrası ikinci adım istendi");
  await second.goto(`${BASE}/admin`);
  ok(second.url().includes("/login"), "kod girilmeden /admin kapalı");
  await second.goto(`${BASE}/login/verify`);
  await second.fill("input[name=code]", "123456");
  await second.click("button[type=submit]");
  ok(await hasAlert(second, "hatalı"), "yanlış kod reddedildi");
  const code = totp(secret, setupStep + 1); // kurulumda kullanılan adım yeniden kullanılamaz; sonraki geçerli
  await second.fill("input[name=code]", code);
  await Promise.all([second.waitForURL(/\/admin/), second.click("button[type=submit]")]);
  ok(true, "doğru kodla giriş tamam");

  const replay = await fresh();
  await login(replay, INVITEE, PASSWORD);
  await replay.waitForURL(/login\/verify/);
  await replay.fill("input[name=code]", code);
  await replay.click("button[type=submit]");
  ok(await hasAlert(replay, "hatalı"), "kullanılmış kod yeniden kullanılamaz");
  await replay.fill("input[name=code]", codes[0]);
  await Promise.all([replay.waitForURL(/\/admin/), replay.click("button[type=submit]")]);
  ok(true, "kurtarma koduyla giriş");
  const again = await fresh();
  await login(again, INVITEE, PASSWORD);
  await again.waitForURL(/login\/verify/);
  await again.fill("input[name=code]", codes[0]);
  await again.click("button[type=submit]");
  ok(await hasAlert(again, "hatalı"), "kurtarma kodu ikinci kez çalışmaz");

  // --- Kapatma ---
  await invitee.goto(`${BASE}/admin/profile`);
  await invitee.click('button:has-text("Kapat")');
  await invitee.fill("input[type=password] >> nth=-1", PASSWORD);
  await invitee.fill("input[autocomplete=one-time-code]", codes[1]);
  await invitee.click('form button[type=submit]:has-text("Kapat")');
  await invitee.waitForSelector("text=kapatıldı");
  const plain = await fresh();
  await login(plain, INVITEE, PASSWORD);
  await plain.waitForURL(/\/admin/);
  ok(true, "2FA kapalıyken yalnız parola yeter");
} catch (error) {
  console.error(error);
  failed++;
} finally {
  await browser.close();
}
console.log(failed === 0 ? "\nTüm doğrulamalar geçti." : `\n${failed} doğrulama başarısız.`);
process.exit(failed === 0 ? 0 : 1);
