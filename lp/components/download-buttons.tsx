"use client";

import { useSyncExternalStore } from "react";
import { Download, Terminal, Package, Monitor, Apple, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { categorizeAsset, formatBytes, type Platform, type ReleaseAsset } from "@/lib/github";

const PLATFORM_META: Record<Platform, { label: string; icon: LucideIcon }> = {
  "linux-appimage": { label: "Linux · AppImage", icon: Terminal },
  "linux-deb": { label: "Linux · .deb", icon: Package },
  windows: { label: "Windows", icon: Monitor },
  macos: { label: "macOS", icon: Apple },
};

const PLATFORM_ORDER: Platform[] = ["linux-appimage", "linux-deb", "windows", "macos"];

// navigator.userAgent never changes after load, so this is a static
// snapshot — no subscription needed, just a no-op unsubscribe.
function subscribe() {
  return () => {};
}

function getSnapshot(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "macos";
  return "linux-appimage";
}

function getServerSnapshot(): Platform | null {
  return null;
}

export function DownloadButtons({ assets }: { assets: ReleaseAsset[] }) {
  const detected = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const byPlatform = new Map<Platform, ReleaseAsset>();
  for (const asset of assets) {
    const meta = categorizeAsset(asset.name);
    if (meta) byPlatform.set(meta.platform, asset);
  }

  return (
    <div className="grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
      {PLATFORM_ORDER.map((platform) => {
        const asset = byPlatform.get(platform);
        const { label, icon: Icon } = PLATFORM_META[platform];
        const isRecommended = detected === platform && Boolean(asset);

        if (!asset) {
          return (
            <div
              key={platform}
              className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-neutral-800 px-4 py-5 text-center text-neutral-600"
            >
              <Icon className="size-6" />
              <span className="text-sm font-medium">{label}</span>
              <span className="flex items-center gap-1 text-xs">
                <Clock className="size-3" />
                em breve
              </span>
            </div>
          );
        }

        return (
          <a
            key={platform}
            href={asset.downloadUrl}
            className={`flex flex-col items-center gap-2 rounded-2xl border px-4 py-5 text-center transition-colors ${
              isRecommended
                ? "border-orange-600 bg-orange-600/10 hover:bg-orange-600/15"
                : "border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900"
            }`}
          >
            <Icon className={`size-6 ${isRecommended ? "text-orange-500" : "text-neutral-300"}`} />
            <span className="text-sm font-medium text-neutral-100">{label}</span>
            <span className="flex items-center gap-1 text-xs text-neutral-400">
              <Download className="size-3" />
              {formatBytes(asset.size)}
            </span>
            {isRecommended && (
              <span className="rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-medium text-white">
                recomendado pra você
              </span>
            )}
          </a>
        );
      })}
    </div>
  );
}
