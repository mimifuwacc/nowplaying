import { Hono } from "hono";
import { MusicServiceFactory } from "../services/music-service-factory";

const redirect = new Hono();

redirect.get("/", (c) => {
  return c.text("Hello Nowplaying!");
});

redirect.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  if (!slug) {
    return c.json({ error: "Missing slug" }, 400);
  }

  try {
    const musicUrl = decodeURIComponent(slug);

    if (!isValidUrl(musicUrl)) {
      return c.json({ error: "Invalid URL" }, 400);
    }

    const provider = MusicServiceFactory.detectServiceFromUrl(musicUrl);
    let title = "Now Playing";
    let description = "Now Playing";
    let ogImageUrl = "";
    let trackTitle = "";
    let trackArtist = "";

    if (provider) {
      const trackId = provider.extractId(musicUrl);
      if (trackId) {
        try {
          const trackData = await provider.fetchTrackData(trackId);
          trackTitle = trackData.title;
          trackArtist = trackData.artist;
          title = `${trackTitle} - ${trackArtist}`;
          description = `Now Playing: ${trackTitle} by ${trackArtist}`;
          const baseUrl = `https://${process.env.PUBLIC_DOMAIN_NAME}` || "http://localhost:3000";
          ogImageUrl = `${baseUrl}/og?url=${encodeURIComponent(musicUrl)}`;
        } catch (error) {
          return c.json({ error: "Failed to fetch track data" }, 500);
        }
      }
    }

    return c.render(
      <>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={title} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImageUrl} />
        <meta http-equiv="refresh" content={`0;url=${musicUrl}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.location.href = ${JSON.stringify(musicUrl)};`,
          }}
        />
      </>
    );
  } catch (error) {
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    const allowedProtocols = ["http:", "https:"];
    return allowedProtocols.includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

export default redirect;
