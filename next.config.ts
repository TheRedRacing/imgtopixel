// next.config.ts
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// ⚠️ Remplace par le nom de ton repo GitHub si ce n’est PAS <username>.github.io
// (ex: 'pixelizer' → l’URL sera https://<username>.github.io/pixelizer/)
const repoName = process.env.NEXT_PUBLIC_GH_PAGES_REPO ?? "imgtopixel";

// Si le repo est <username>.github.io, PAS de basePath/assetPrefix
const isUserSite = repoName.endsWith(".github.io");

const nextConfig: NextConfig = {
	output: "export", // génère /out en statique (pas besoin de `next export`)
	trailingSlash: true, // indispensable pour GitHub Pages (…/index.html)
	basePath: isProd && !isUserSite ? `/${repoName}` : undefined,
	assetPrefix: isProd && !isUserSite ? `/${repoName}/` : undefined,
	images: { unoptimized: true }, // utile si tu utilises `next/image`
	// reactStrictMode: true, // optionnel
};

export default nextConfig;
