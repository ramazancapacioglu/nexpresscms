import assert from "node:assert/strict";
import { test } from "node:test";
import { likeEscape } from "../src/media-admin-repository";

test("LIKE kaçışı joker ve kaçış karakterlerini etkisizleştirir", () => {
  assert.equal(likeEscape("med_ab%cd!ef"), "med!_ab!%cd!!ef");
  assert.equal(likeEscape("plain"), "plain");
});
