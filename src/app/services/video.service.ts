import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MediaImageLink, MediaVideoLink } from 'dc-extensions-sdk/dist/types/lib/components/MediaLink';
import { FieldService } from './field.service';
import { ShoppableVideoData } from '../field/model/shoppable-video-data';
import { DiVideoMedia, DiVideoMetadata } from '../field/model/di-video-metadata';
import { lastValueFrom } from 'rxjs';
import { VisualizationSdkService } from './visualization-sdk.service';

export enum VideoErrorType {
  None,
  Metadata,
  Publish
}

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  videoMeta: DiVideoMetadata | null = null;
  videoReady = false;
  videoError: VideoErrorType = VideoErrorType.None;

  lastVideo: MediaVideoLink | null = null;
  video: HTMLVideoElement | null = null;
  framerate = 0;
  duration = 60;

  private hasLoop = false;
  playing = false;
  private hasSeekLoop = false;
  seeking = false;
  currentTime = 0;

  videoUIProvider?: () => Promise<HTMLVideoElement>;
  videoChanged: EventEmitter<HTMLVideoElement> = new EventEmitter();
  videoProgress: EventEmitter<number> = new EventEmitter();

  boundLoop: () => void;
  seekLoop: () => void;

  constructor(private field: FieldService, private http: HttpClient, private vis: VisualizationSdkService) {
    if (field.data != null) {
      this.parseDataChange(field.data);
    }
    field.fieldUpdated.subscribe(data => {
      this.parseDataChange(data);
    });

    this.boundLoop = this.videoPlayingLoop.bind(this);
    this.seekLoop = this.videoSeekingLoop.bind(this);
  }

  buildImageSrc(video: MediaImageLink, forcePublished = false): string {
    return `https://${this.field.getVideoHost(forcePublished)}/v/${video.endpoint}/${encodeURIComponent(video.name)}`;
  }

  private formatToHtml(format: string): string {
    if (format === 'mpeg4') {
      return 'mp4';
    }

    return format;
  }

  videoPlayingLoop() {
    this.videoProgress.emit(this.currentTime);
    if (this.playing) {
      // Apply a bias of two frames to the video current time, so that the hotspots better line up with the content.
      const delta = 2/60;

      this.currentTime = Math.min(this.duration, (this.video?.currentTime || 0) + delta);
      requestAnimationFrame(this.boundLoop);
    } else {
      this.currentTime = this.video?.currentTime || 0;
      this.hasLoop = false;
    }
  }

  videoSeekingLoop() {
    this.currentTime = this.video?.currentTime || 0;
    this.videoProgress.emit(this.currentTime);
    if (this.seeking) {
      requestAnimationFrame(this.seekLoop);
    } else {
      this.hasSeekLoop = false;
    }
  }

  videoPlayStart() {
    this.playing = true;

    if (!this.hasLoop) {
      requestAnimationFrame(this.boundLoop);
      this.hasLoop = true;
    }
  }

  videoPause() {
    this.setCurrentTime(this.quantize((this.video as HTMLVideoElement).currentTime));
    this.videoPlayEnd();
  }

  videoPlayEnd() {
    this.playing = false;
  }

  async loadImage(data: ShoppableVideoData) {
    this.videoReady = false;
    this.videoError = VideoErrorType.None;
    if (data.video != null && (data.video as MediaImageLink).name != null) {
      try {
        this.videoMeta = (await lastValueFrom(this.http.get(this.buildImageSrc(data.video as MediaImageLink) + '.json?metadata=true'))) as DiVideoMetadata;

        if (this.videoMeta.meta.metadata == null || this.videoMeta.meta.metadata.video == null) {
          console.log('Video metadata incomplete.');
          this.videoError = VideoErrorType.Metadata;
          this.videoMeta = null;
          this.videoReady = true;
        }
      } catch {
        console.log('Could not load video metadata.');

        // Determine if the video metadata could not be loaded due to not being published

        let videoError = VideoErrorType.Metadata;
        try {
          const meta = (await lastValueFrom(this.http.get(this.buildImageSrc(data.video as MediaImageLink, true) + '.json'))) as DiVideoMetadata;
        } catch {
          videoError = VideoErrorType.Publish;
        }

        this.videoError = videoError;
        this.videoMeta = null;
        this.videoReady = true;
      }

      if (this.videoUIProvider && this.videoMeta) {
        const subset = this.selectHQMediaSubset(this.videoMeta.media);

        if (subset.length > 0) {
          const video = await this.videoUIProvider();
          video.style.visibility = '';
          video.oncanplay = this.videoLoaded.bind(this);
          video.onplay = this.videoPlayStart.bind(this);
          video.onpause = this.videoPause.bind(this);
          video.onended = this.videoPlayEnd.bind(this);
          video.onerror = (event: string | Event) => {
            this.videoError = VideoErrorType.Publish;
            this.videoReady = true;
          };
          while (video.firstChild) {
            video.removeChild(video.firstChild);
          }

          for (const item of subset) {
            const source = document.createElement('source');
            source.src = item.src;
            source.type = `video/${this.formatToHtml(item.format)}`;
            video.appendChild(source);
          }
          video.poster = this.buildImageSrc(data.video as MediaImageLink);
          video.load();

          if (this.vis.active) {
            this.registerExtraEvents(video);
          }

          this.video = video;
        } else {
          this.videoError = VideoErrorType.Publish;
          this.videoReady = true;
        }

        this.framerate = 60;
        if (this.videoMeta.meta.metadata && this.videoMeta.meta.metadata.video) {
          const extra = this.videoMeta.meta.metadata.video;
          this.framerate = extra['frame-rate'];
        }
      }
    } else {
      this.video = null;
      if (this.videoUIProvider) {
        const video = await this.videoUIProvider();
        video.style.visibility = 'hidden';
      }
    }
  }

  // These video events are for the visualization,
  // or any other attempt to use the video element with its
  // default controls.
  registerExtraEvents(video: HTMLVideoElement) {
    video.addEventListener('seeking', () => {
      this.seeking = true;

      if (!this.hasSeekLoop) {
        requestAnimationFrame(this.seekLoop);
        this.hasSeekLoop = true;
      }
    });
    video.addEventListener('seeked', () => {
      this.seeking = false;
    });
  }

  selectHQMediaSubset(media: DiVideoMedia[]): DiVideoMedia[] {
    // Select the media entries with the highest bitrate for their given format.
    const formatMap = new Map<string, DiVideoMedia>();

    for (const item of media) {
      const format = `${item.format}/${item['video.codec']}`;

      const best = formatMap.get(format);

      if (!best || best.bitrate < item.bitrate) {
        // If the bitrate is higher or this format hasn't been seen before, add it to the thing.
        formatMap.set(format, item);
      }
    }

    return Array.from(formatMap.values());
  }

  async videoLoaded(event: Event): Promise<void> {
    this.duration = this.video?.duration ?? 60;
    this.videoReady = true;
    this.videoChanged.emit(this.video as HTMLVideoElement);
  }

  videoEqual(now: MediaVideoLink | null, then: MediaVideoLink | null) {
    if ((now == null) !== (then == null)) {
      return false;
    }

    if (now == null) {
      return true;
    }

    const nowAny = now as any;
    const thenAny = then as any;

    return nowAny.id === thenAny.id &&
      nowAny.name === thenAny.name &&
      nowAny.endpoint === thenAny.endpoint &&
      nowAny.defaultHost === thenAny.defaultHost &&
      nowAny.mediaType === thenAny.mediaType;
  }

  parseDataChange(data: ShoppableVideoData): void {
    if (!this.videoEqual(data.video, this.lastVideo)) {
      this.loadImage(data);
      this.lastVideo = data.video;
    }
  }

  setCurrentTime(time: number): void {
    if (this.video) {
      this.video.currentTime = time;
      this.currentTime = time;
      this.videoProgress.emit(this.currentTime);
    }
  }

  changeCurrentTime(delta: number): void {
    if (this.video) {
      this.video.currentTime += delta;
      this.currentTime = this.video.currentTime;
      this.videoProgress.emit(this.currentTime);
    }
  }

  quantize(time: number): number {
    return Math.floor(time * this.framerate) / this.framerate;
  }

  quantizeEqual(time: number, compare: number): boolean {
    return this.quantize(time) === this.quantize(compare);
  }

  forceRedraw(): void {
    this.videoProgress.emit(this.currentTime);
  }
}
