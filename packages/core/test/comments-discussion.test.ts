import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCommentTree,
  commentAvatarProps,
  computeRatingSummary,
  incrementCommentUpvoteTag,
  parseCommentTags,
  serializeCommentTags,
  validatePublicCommentSubmission,
} from "../src/comments-discussion";

describe("comments-discussion (yorum ağacı, puan dağılımı ve spam doğrulaması)", () => {
  it("parseCommentTags ve serializeCommentTags: sabitleme, resmi rozet ve oy sayısını korur", () => {
    const tags = serializeCommentTags({
      visibleTags: ["müşteri", "Kurulum", "müşteri"],
      pinned: true,
      official: true,
      upvotes: 7,
    });
    const parsed = parseCommentTags(tags);
    assert.equal(parsed.pinned, true);
    assert.equal(parsed.official, true);
    assert.equal(parsed.upvotes, 7);
    assert.deepEqual(parsed.visibleTags, ["müşteri", "Kurulum"]);

    const bumped = parseCommentTags(incrementCommentUpvoteTag(tags, 1));
    assert.equal(bumped.upvotes, 8);
    assert.equal(bumped.pinned, true);
  });

  it("buildCommentTree: sabitlenen yorumu en üste alır ve 3 katmandan derin yanıtları düzleştirir", () => {
    const items = [
      { id: "c1", parentId: null, authorName: "Ali", body: "İlk yorum", createdAtMs: 1000, tags: ["_up:2"] },
      { id: "c2", parentId: null, authorName: "Zeynep", body: "Sabit yorum", createdAtMs: 500, tags: ["_pinned"] },
      { id: "c3", parentId: "c1", authorName: "Bora", body: "Seviye 2", createdAtMs: 1100 },
      { id: "c4", parentId: "c3", authorName: "Cem", body: "Seviye 3", createdAtMs: 1200 },
      { id: "c5", parentId: "c4", authorName: "Deniz", body: "Seviye 4 (düzleşmeli)", createdAtMs: 1300 },
    ];

    const tree = buildCommentTree(items, "popular", 3);
    assert.equal(tree.length, 2);
    assert.equal(tree[0]!.id, "c2"); // sabitlenen en üstte
    assert.equal(tree[1]!.id, "c1");
    assert.equal(tree[1]!.totalReplies, 3);
    const level2 = tree[1]!.children[0]!;
    assert.equal(level2.id, "c3");
    const level3 = level2.children[0]!;
    assert.equal(level3.id, "c4");
    assert.equal(level3.children[0]!.id, "c5");
    assert.equal(level3.children[0]!.replyToAuthor, "Cem");
  });

  it("computeRatingSummary: 5-1 yıldız yüzdelerini ve ortalamayı hesaplar", () => {
    const summary = computeRatingSummary([
      { rating: 5, isVerified: true },
      { rating: 5, isVerified: true },
      { rating: 4, isVerified: false },
      { rating: 2, isVerified: true },
    ]);
    assert.equal(summary.total, 4);
    assert.equal(summary.average, 4);
    assert.equal(summary.verifiedCount, 3);
    assert.equal(summary.stars.find((s) => s.star === 5)?.percent, 50);
    assert.equal(summary.stars.find((s) => s.star === 4)?.percent, 25);
  });

  it("validatePublicCommentSubmission: honeypot ve çoklu link spam'ini reddeder, temiz veriyi geçirir", () => {
    assert.equal(
      validatePublicCommentSubmission({ honeypot: "bot", contentId: "cnt_1", authorName: "A", body: "Merhaba" }).ok,
      false
    );
    const spam = validatePublicCommentSubmission({
      contentId: "cnt_1",
      authorName: "Spammer",
      body: "Bak https://a.com ve https://b.com ve https://c.com",
    });
    assert.equal(spam.ok, false);

    const valid = validatePublicCommentSubmission({
      contentId: "cnt_1",
      entryType: "review",
      authorName: "Ayşe Yılmaz",
      rating: 5,
      title: "Harika hız",
      body: "Kurulum 5 dakika sürdü.",
      prosText: "Hızlı kurulum\nSıfır JS",
      consText: "Yok",
    });
    assert.equal(valid.ok, true);
    if (valid.ok) {
      assert.equal(valid.data.rating, 5);
      assert.deepEqual(valid.data.pros, ["Hızlı kurulum", "Sıfır JS"]);
    }
  });

  it("commentAvatarProps: yazar adından deterministik baş harf ve renk üretir", () => {
    const avatar = commentAvatarProps("Ramazan Çapacıoğlu");
    assert.equal(avatar.initials, "RÇ");
    assert.ok(avatar.bg.startsWith("#"));
  });
});

