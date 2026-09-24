type Hit = { count: number; resetAt: number };

const hits = new Map<string, Hit>();

// Dọn dẹp các entry hết hạn để tránh memory leak
function cleanupExpiredEntries(now: number) {
  for (const [key, hit] of hits.entries()) {
    if (hit.resetAt <= now) {
      hits.delete(key);
    }
  }
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  
  // Dọn dẹp định kỳ khi map quá lớn
  if (hits.size > 1000) {
    cleanupExpiredEntries(now);
  }

  let current = hits.get(key);

  if (!current || current.resetAt <= now) {
    // Xóa entry cũ nếu hết hạn
    if (current && current.resetAt <= now) {
      hits.delete(key);
    }
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  current.count += 1;
  const isAllowed = current.count <= limit;

  return {
    ok: isAllowed,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt
  };
}
