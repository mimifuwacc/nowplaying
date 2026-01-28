import { MusicService } from "./music-service";
import type { MusicServiceProvider, TrackData } from "./music-service";

interface YouTubeVideoResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      channelTitle: string;
      description: string;
      thumbnails: {
        maxres?: { url: string };
        high?: { url: string };
        medium?: { url: string };
        default?: { url: string };
      };
    };
  }>;
}

export class YouTubeMusicProvider implements MusicServiceProvider {
  service = MusicService.YOUTUBE_MUSIC;

  extractId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|music\.youtube\.com\/watch\?v=)([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  async fetchTrackData(videoId: string): Promise<TrackData> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error("YouTube Data API key is not configured");
    }

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`YouTube API request failed: ${response.status}`);
    }

    const data = (await response.json()) as YouTubeVideoResponse;

    if (!data.items || data.items.length === 0) {
      throw new Error("Video not found");
    }

    const video = data.items[0];
    const snippet = video.snippet;

    return {
      title: snippet.title || "Unknown Title",
      artist: snippet.channelTitle || "Unknown Artist",
      thumbnail:
        snippet.thumbnails?.maxres?.url ||
        snippet.thumbnails?.high?.url ||
        snippet.thumbnails?.medium?.url ||
        snippet.thumbnails?.default?.url ||
        "",
      description: snippet.description || "",
      serviceUrl: `https://music.youtube.com/watch?v=${videoId}`,
    };
  }

  getServiceName(): string {
    return "YouTube Music";
  }

  getServiceIcon(): string {
    return "youtube-music";
  }
}
