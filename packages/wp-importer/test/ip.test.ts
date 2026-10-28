import test from "node:test";
import assert from "node:assert/strict";
import { isPublicIp } from "../src/ip";

test("SSRF: özel, yerel, bulut meta verisi ve belgeleme aralıkları genel sayılmaz", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "255.255.255.255", "198.18.0.1", "192.0.2.5",
    "::", "::1", "fc00::1", "fd12:3456::1", "fe80::1", "fe80::1%eth0", "ff02::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "::ffff:169.254.169.254", "64:ff9b::a00:1", "2002:7f00:1::1", "2001:db8::1"]) {
    assert.equal(isPublicIp(ip), false, ip);
  }
});

test("SSRF: genel adresler geçer; biçimi bozuk ve alan adı olanlar geçmez", () => {
  for (const ip of ["8.8.8.8", "1.1.1.1", "172.15.0.1", "172.32.0.1", "100.63.0.1", "93.184.216.34", "2606:4700:4700::1111", "2a00:1450:4001::200e", "::ffff:8.8.8.8"]) assert.equal(isPublicIp(ip), true, ip);
  for (const bad of ["", "localhost", "example.com", "1.2.3", "1.2.3.4.5", "256.1.1.1", "1::2::3", "gggg::1", "12345::1", "0x7f.0.0.1", "2130706433"]) assert.equal(isPublicIp(bad), false, bad);
});
