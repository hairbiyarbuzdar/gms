import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root. Without this, Turbopack walks up looking for a
  // lockfile and finds one in the home directory, which would pull the whole
  // user profile into the build scope.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
