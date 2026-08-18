const REPO = "brunonunestx/claude-manager";

type GitHubAsset = {
  name: string;
  size: number;
  browser_download_url: string;
};

type GitHubReleaseResponse = {
  tag_name: string;
  published_at: string;
  assets: GitHubAsset[];
};

export type ReleaseAsset = {
  name: string;
  size: number;
  downloadUrl: string;
};

export type LatestRelease = {
  version: string;
  publishedAt: string;
  assets: ReleaseAsset[];
};

export async function getLatestRelease(): Promise<LatestRelease | null> {
  try {
    // Static export (GitHub Pages) has no server to revalidate on, so this
    // request only ever runs once, at `next build` time.
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as GitHubReleaseResponse;

    return {
      version: data.tag_name.replace(/^v/, ""),
      publishedAt: data.published_at,
      assets: data.assets
        .filter((asset) => !asset.name.endsWith(".yml") && !asset.name.endsWith(".blockmap"))
        .map((asset) => ({
          name: asset.name,
          size: asset.size,
          downloadUrl: asset.browser_download_url,
        })),
    };
  } catch {
    return null;
  }
}

export function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(0)} MB`;
}

export type Platform = "linux-appimage" | "linux-deb" | "windows" | "macos";

export function categorizeAsset(name: string): { platform: Platform; label: string } | null {
  if (name.endsWith(".AppImage")) return { platform: "linux-appimage", label: "Linux (AppImage)" };
  if (name.endsWith(".deb")) return { platform: "linux-deb", label: "Linux (.deb)" };
  if (name.endsWith(".exe")) return { platform: "windows", label: "Windows" };
  if (name.endsWith(".dmg")) return { platform: "macos", label: "macOS" };
  return null;
}
