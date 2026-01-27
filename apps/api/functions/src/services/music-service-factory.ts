import { MusicService } from "./music-service";
import { SpotifyProvider } from "./spotify-provider";
import { YouTubeMusicProvider } from "./youtube-music-provider";
import type { MusicServiceProvider } from "./music-service";

export class MusicServiceFactory {
  private static providers = new Map<MusicService, MusicServiceProvider>([
    [MusicService.YOUTUBE_MUSIC, new YouTubeMusicProvider()],
    [MusicService.SPOTIFY, new SpotifyProvider()],
  ]);

  static detectServiceFromUrl(url: string): MusicServiceProvider | null {
    for (const provider of this.providers.values()) {
      if (provider.extractId(url)) {
        return provider;
      }
    }
    return null;
  }

  static getProvider(service: MusicService): MusicServiceProvider {
    const provider = this.providers.get(service);
    if (!provider) {
      throw new Error(`Unsupported music service: ${service}`);
    }
    return provider;
  }

  static getAllProviders(): MusicServiceProvider[] {
    return Array.from(this.providers.values());
  }
}
