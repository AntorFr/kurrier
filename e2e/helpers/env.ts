export const WORKER_URL = process.env.E2E_WORKER_URL || "http://localhost:3001";
export const ADMIN_KEY =
	process.env.E2E_ADMIN_KEY ||
	"e2e-admin-key-0123456789abcdef0123456789abcdef";

// Companions from docker-compose.e2e.yml
export const SMTP_HOST = process.env.E2E_SMTP_HOST || "localhost";
export const SMTP_PORT = Number(process.env.E2E_SMTP_PORT || 3025);
export const IMAP_HOST = process.env.E2E_IMAP_HOST || "localhost";
export const IMAP_PORT = Number(process.env.E2E_IMAP_PORT || 3143);
