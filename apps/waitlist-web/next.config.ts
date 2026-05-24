import path from 'path';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';

const appDir = __dirname;
const crmDir = path.join(appDir, '../web-crm');

// Reutiliza Firebase / Resend del CRM si no hay .env.local en waitlist-web
loadEnvConfig(crmDir);
loadEnvConfig(appDir);

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
