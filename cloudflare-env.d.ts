declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ADMIN_OWNER_EMAIL?: string;
    DATABASE_URL?: string;
  }
}
