import test from "node:test";
import assert from "node:assert/strict";
import {
  acceptVerifyCode,
  cnameHit,
  extractMetrikaCounterId,
  googleTxtValue,
  normalizeWebmasterVerification,
  txtHit,
  validateMetrikaHtml,
  verificationHosts,
  yandexTxtValue,
} from "../src/webmaster-connect";

test("doğrulama kodu: etiket, dns satırı ve düz jeton aynı koda iner", () => {
  assert.equal(
    acceptVerifyCode('<meta name="google-site-verification" content="abc123XYZ_-9" />'),
    "abc123XYZ_-9",
  );
  assert.equal(acceptVerifyCode("google-site-verification=abc123XYZ_-9"), "abc123XYZ_-9");
  assert.equal(acceptVerifyCode("yandex-verification: yandexcode123"), "yandexcode123");
  assert.equal(acceptVerifyCode('"><script>'), "");
  assert.equal(acceptVerifyCode("kısa"), "");
});

test("dns kaydı metni ve eşleşme", () => {
  assert.equal(googleTxtValue("abc123XYZ_-9"), "google-site-verification=abc123XYZ_-9");
  assert.equal(yandexTxtValue("yandexcode123"), "yandex-verification: yandexcode123");
  assert.equal(txtHit([["google-site-verification=", "abc123XYZ_-9"]], googleTxtValue("abc123XYZ_-9")), true);
  assert.equal(txtHit([["v=spf1 include:_spf.google.com ~all"]], googleTxtValue("abc123XYZ_-9")), false);
  assert.equal(cnameHit(["verify.bing.com."]), true);
  assert.equal(cnameHit(["evil.verify.bing.com"]), false);
});

test("alan adı: www ve kök, localhost yok", () => {
  assert.deepEqual(verificationHosts("https://www.akinsoftizmir.com.tr/"), ["akinsoftizmir.com.tr", "www.akinsoftizmir.com.tr"]);
  assert.deepEqual(verificationHosts("localhost"), []);
});

test("kayıt: bozuk kod kaydı düşürür, boş alan silinir", () => {
  const ok = normalizeWebmasterVerification({
    google: '<meta name="google-site-verification" content="abc123XYZ_-9" />',
    bing: "",
    dns: { yandex: "yandexcode123" },
    bingCname: "Bing-Auth1",
  });
  assert.equal(ok.error, undefined);
  assert.deepEqual(ok.value, {
    google: "abc123XYZ_-9",
    dns: { yandex: "yandexcode123" },
    bingCname: "bing-auth1",
  });
  assert.match(normalizeWebmasterVerification({ google: "<script>" }).error ?? "", /Google meta/);
});

test("metrika HTML kodu: doğrulama ve sayaç numarası ayıklama", () => {
  const sample = `<!-- Yandex.Metrika counter -->\n<script>(function(m,e,t,r,i,k,a){})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=98684133','ym');ym(98684133,'init',{webvisor:true});</script>`;
  assert.equal(extractMetrikaCounterId(sample), "98684133");
  assert.equal(extractMetrikaCounterId('<img src="https://mc.yandex.ru/watch/104556789" />'), "104556789");
  assert.equal(extractMetrikaCounterId("geçersiz metin"), "");
  assert.equal(validateMetrikaHtml("").error, undefined);
  assert.equal(validateMetrikaHtml(sample).error, undefined);
  assert.match(validateMetrikaHtml("<script>alert(1)</script>").error ?? "", /Yandex Metrika/);
});
