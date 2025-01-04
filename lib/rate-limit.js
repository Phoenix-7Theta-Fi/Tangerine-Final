import { RateLimiterMemory } from 'rate-limiter-flexible';

// Create rate limiter instance
const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 60, // per 60 seconds
});

export default function rateLimit(options = {}) {
  return async (req, res, next) => {
    try {
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const key = options.key || ip;

      await rateLimiter.consume(key);
      next();
    } catch (error) {
      res.status(429).json({
        success: false,
        message: 'Too many requests',
        retryAfter: error.msBeforeNext / 1000,
      });
    }
  };
}