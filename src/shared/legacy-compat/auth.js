// src/shared/legacy-compat/auth.js
// Compatibility helpers for legacy member state detection.
export function getCurrentMember() {
  if (typeof window === "undefined") {
    return { verified: false, id: null };
  }

  if (window.memberVerified && window.memberData) {
    return { verified: true, ...window.memberData };
  }

  if (window.customerInfo) {
    return {
      verified: true,
      id: window.customerInfo.id || window.customerInfo.email,
      email: window.customerInfo.email,
      displayName: window.customerInfo.name || window.customerInfo.email,
    };
  }

  return { verified: false, id: null };
}

export function requireMember() {
  const member = getCurrentMember();
  if (!member.verified) {
    throw new Error("請先登入會員");
  }
  return member;
}

export function withMember(callback) {
  try {
    const member = requireMember();
    return callback(member);
  } catch (err) {
    alert(err.message);
    throw err;
  }
}
