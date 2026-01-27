export interface TrackData {
  title: string;
  artist: string;
  album?: string;
  thumbnail: string;
  description?: string;
  serviceUrl: string;
}

export enum MusicService {
  YOUTUBE_MUSIC = "youtube_music",
  SPOTIFY = "spotify",
}

export interface MusicServiceProvider {
  service: MusicService;
  extractId(url: string): string | null;
  fetchTrackData(id: string): Promise<TrackData>;
  getServiceName(): string;
  getServiceIcon(): string;
}
