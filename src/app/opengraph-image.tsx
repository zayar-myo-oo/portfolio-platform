import { getSiteSettings } from "@/server/data/settings";
import { OG_SIZE, renderOgImage } from "@/server/og";

export const alt = "Portfolio";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const settings = await getSiteSettings();
  return renderOgImage({
    eyebrow: settings.role,
    title: settings.ownerName,
    subtitle: settings.statement.length > 150 ? `${settings.statement.slice(0, 147)}…` : settings.statement,
    footer: "Projects · Portal · Notes",
  });
}
