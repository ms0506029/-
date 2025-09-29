// src/shared/legacy-compat/interactions.js
// Normalized interaction entry points used by new profile page.
import { post } from "./apiClient.js";
import { requireMember } from "./auth.js";

async function sendInteraction(route, payload) {
  return post(`?route=${route}`, payload);
}

export async function like(lookId) {
  const member = requireMember();
  return sendInteraction("like", { profile_id: member.id, look_id: lookId });
}

export async function markReference(lookId) {
  const member = requireMember();
  return sendInteraction("ref", { profile_id: member.id, look_id: lookId });
}

export async function markPurchase(lookId, sku) {
  const member = requireMember();
  return sendInteraction("purchase_mark", { profile_id: member.id, look_id: lookId, sku });
}

export async function follow(creatorProfileId) {
  const member = requireMember();
  return sendInteraction("follow", {
    follower_id: member.id,
    creator_id: creatorProfileId,
  });
}

export async function unfollow(creatorProfileId) {
  const member = requireMember();
  return sendInteraction("unfollow", {
    follower_id: member.id,
    creator_id: creatorProfileId,
  });
}
