import { createApp } from "./app.js";
import { RateLimiter } from "./rate-limit.js";
import { createD1Repository } from "./repository.js";

const rateLimiter = new RateLimiter(100, 60_000);

export default {
  async fetch(request, env) {
    const app = createApp({
      repository: createD1Repository(env.DB),
      rateLimiter,
      env
    });
    return app.fetch(request);
  }
};
