import assert from "node:assert/strict";
import test from "node:test";
import { canOpenAdminPath, contentAccess, contentOwnerId, isLimitedRole, isUserRole, ROLE_CAPABILITIES, roleCan, USER_ROLES } from "../src/index";

test("roller: dört rol, bilinmeyen değer reddedilir", () => {
  assert.deepEqual([...USER_ROLES], ["admin", "editor", "author", "contributor"]);
  assert.equal(isUserRole("author"), true);
  assert.equal(isUserRole("root"), false);
  assert.equal(isUserRole(undefined), false);
});

test("matris: yönetici hepsi; editör kullanıcı/ayar hariç hepsi (eski davranış); yazar ve katkıcı dar", () => {
  assert.equal(roleCan("admin", "users.manage"), true);
  assert.equal(roleCan("editor", "users.manage"), false);
  assert.equal(roleCan("editor", "settings.manage"), false);
  for (const c of ["content.editAny", "content.publish", "appearance.manage", "commerce.manage", "media.upload", "panel.full"] as const) assert.equal(roleCan("editor", c), true, c);
  assert.deepEqual([...ROLE_CAPABILITIES.author].sort(), ["content.create", "content.editOwn", "content.publish", "media.upload"]);
  assert.deepEqual([...ROLE_CAPABILITIES.contributor].sort(), ["content.create", "content.editOwn"]);
  assert.equal(roleCan("contributor", "content.publish"), false);
  assert.equal(roleCan(undefined, "content.create"), false);
  assert.equal(roleCan("bilinmeyen" as never, "content.create"), false);
});

test("sınırlı roller: yazar ve katkıcı tam panel kullanamaz", () => {
  assert.deepEqual(USER_ROLES.map(isLimitedRole), [false, false, true, true]);
  assert.equal(isLimitedRole(undefined), true, "rolsüz = sınırlı (varsayılan ret)");
});

test("yönetim yolları: sınırlı rol yalnızca içerik yollarını açar", () => {
  assert.equal(canOpenAdminPath("admin", "/admin/settings"), true);
  assert.equal(canOpenAdminPath("editor", "/admin/themes"), true);
  for (const p of ["/admin/my-content", "/admin/contents", "/admin/media", "/admin/profile"]) assert.equal(canOpenAdminPath("author", p), true, p);
  for (const p of ["/admin", "/admin/pages", "/admin/users", "/admin/themes", "/admin/contents-evil"]) assert.equal(canOpenAdminPath("contributor", p), false, p);
});

test("içerik sahibi: yalnızca dolu metin kabul edilir", () => {
  assert.equal(contentOwnerId({ _ownerId: "u1" }), "u1");
  assert.equal(contentOwnerId({ _ownerId: 5 }), null);
  assert.equal(contentOwnerId({ _ownerId: "" }), null);
  assert.equal(contentOwnerId(null), null);
});

test("içerik erişimi: editör her şeyi; yazar kendi içeriğini her durumda; katkıcı yalnızca kendi taslağını", () => {
  const mine = (status: string) => ({ schemaAttributes: { _ownerId: "me" }, status });
  const theirs = { schemaAttributes: { _ownerId: "other" }, status: "draft" };
  const legacy = { schemaAttributes: {}, status: "draft" };
  assert.deepEqual(contentAccess("editor", "me", theirs), { edit: true, publish: true });
  assert.deepEqual(contentAccess("author", "me", null), { edit: true, publish: true });
  assert.deepEqual(contentAccess("author", "me", mine("published")), { edit: true, publish: true });
  assert.equal(contentAccess("author", "me", theirs).edit, false);
  assert.equal(contentAccess("author", "me", legacy).edit, false, "sahipsiz eski içerik yalnızca editörde");
  assert.deepEqual(contentAccess("contributor", "me", null), { edit: true, publish: false });
  assert.equal(contentAccess("contributor", "me", mine("draft")).edit, true);
  assert.equal(contentAccess("contributor", "me", mine("published")).edit, false, "yayındaki içerik editöre geçer");
  assert.equal(contentAccess("contributor", "me", mine("scheduled")).edit, false);
  assert.equal(contentAccess("contributor", "me", theirs).edit, false);
});
