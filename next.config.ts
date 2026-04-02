import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Cursor Cloud ingress domains to access dev assets/HMR.
  allowedDevOrigins: ["agent.cvm.dev", "*.agent.cvm.dev"],
};

export default nextConfig;
