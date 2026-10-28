import React from "react";
import { headers } from "next/headers";
import { getScopedRepository } from "@nexpress/database";
import { CommentsReviewsClient } from "@/components/admin/comments-reviews-client";

export default async function AdminCommentsPage() {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const [reviews, contents] = await Promise.all([
    repo.listCommentsReviews(),
    repo.listContents({ locale: "tr" }),
  ]);

  return (
    <CommentsReviewsClient initialReviews={reviews} contents={contents} />
  );
}
