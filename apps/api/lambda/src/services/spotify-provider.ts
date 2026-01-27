import { MusicService } from "./music-service";
import type { MusicServiceProvider, TrackData } from "./music-service";

export class SpotifyProvider implements MusicServiceProvider {
  service = MusicService.SPOTIFY;

  extractId(url: string): string | null {
    const patterns = [
      /spotify\.com\/track\/([a-zA-Z0-9]+)/,
      /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  async fetchTrackData(trackId: string): Promise<TrackData> {
    const accessToken = await this.getAccessToken();

    const apiUrl = `https://api.spotify.com/v1/tracks/${trackId}`;

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Spotify API request failed: ${response.status}`);
    }

    const track = (await response.json()) as {
      name: string;
      artists: { name: string }[];
      album: { name: string; images: { url: string }[] };
      external_urls: { spotify: string };
    };

    return {
      title: track.name || "Unknown Title",
      artist:
        track.artists?.map((artist: { name: string }) => artist.name).join(", ") ||
        "Unknown Artist",
      album: track.album?.name,
      thumbnail: track.album?.images?.[0]?.url || "",
      serviceUrl: track.external_urls?.spotify || `https://open.spotify.com/track/${trackId}`,
    };
  }

  private async getAccessToken(): Promise<string> {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Spotify client credentials are not configured");
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error(`Spotify token request failed: ${response.status}`);
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  }

  getServiceName(): string {
    return "Spotify";
  }

  getServiceIcon(): string {
    return "spotify";
  }
}
