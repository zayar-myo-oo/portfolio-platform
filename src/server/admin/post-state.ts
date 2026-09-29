import "server-only";

export type PostPublicState = "draft" | "scheduled" | "published";

/** Draft, scheduled (published with a future date) or live — evaluated at request time. */
export function postPublicState(post: { status: string; publishedAt: Date | null }): PostPublicState {
  if (post.status !== "PUBLISHED") return "draft";
  if (post.publishedAt && post.publishedAt.getTime() > Date.now()) return "scheduled";
  return "published";
}

export const POST_STATE_LABEL: Record<PostPublicState, { label: string; tone: string }> = {
  draft: { label: "Draft", tone: "text-beta" },
  scheduled: { label: "Scheduled", tone: "text-development" },
  published: { label: "Published", tone: "text-live" },
};
