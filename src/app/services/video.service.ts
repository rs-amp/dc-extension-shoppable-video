import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MediaImageLink, MediaVideoLink } from 'dc-extensions-sdk/dist/types/lib/components/MediaLink';
import { FieldService } from './field.service';
import { ShoppableVideoData } from '../field/model/shoppable-video-data';
import { DiVideoMedia, DiVideoMetadata } from '../field/model/di-video-metadata';
import { lastValueFrom } from 'rxjs';
import { VisualizationSdkService } from './visualization-sdk.service';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  videoMeta: DiVideoMetadata | null = null;
  videoReady = false;
  videoError: string | null = null;

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

  buildImageSrc(video: MediaImageLink): string {
    return `https://${this.field.getVideoHost()}/v/${video.endpoint}/${encodeURIComponent(video.name)}`;
  }

  private formatToHtml(format: string): string {
    if (format === 'mpeg4') {
      return 'mp4';
    }

    return format;
  }

  videoPlayingLoop() {
    this.currentTime = this.video?.currentTime || 0;
    this.videoProgress.emit(this.currentTime);
    if (this.playing) {
      requestAnimationFrame(this.boundLoop);
    } else {
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
    this.videoError = null;
    if (data.video != null) {
      try {
        this.videoMeta = (await lastValueFrom(this.http.get(this.buildImageSrc(data.video as MediaImageLink) + '.json?metadata=true'))) as DiVideoMetadata;
        /*
        if (this.videoMeta.status === 'error') {
          throw new Error(this.videoMeta.errorMsg);
        }
        */
       /*
        this.imageSizeMultiplier = [this.videoMeta.width / this.imageWidth, this.videoMeta.height / this.imageHeight];
        this.imageWidth = this.videoMeta.width;
        this.imageHeight = this.videoMeta.height;

        // limit size of preview image to a reasonable scale
        if (!this.field.fullRes) {
          if (this.imageWidth > this.imageHeight) {
            if (this.imageWidth > this.imageSizeLimit) {
              defaultParams = `?w=${this.imageSizeLimit}`;
            }
          } else {
            if (this.imageHeight > this.imageSizeLimit) {
              defaultParams = `?h=${this.imageSizeLimit}`;
            }
          }
        }
        */
      } catch {
        console.log('Could not load video metadata...');
        this.videoError = 'Video metadata missing - make sure the video is published in Content Hub.';
        this.videoMeta = null;
        //this.imageSizeMultiplier = [1, 1];
      }

      if (this.videoUIProvider && this.videoMeta) {
        const subset = this.selectHQMediaSubset(this.videoMeta.media);

        if (subset.length > 0) {
          const video = await this.videoUIProvider();
          video.oncanplay = this.videoLoaded.bind(this);
          video.onplay = this.videoPlayStart.bind(this);
          video.onpause = this.videoPause.bind(this);
          video.onended = this.videoPlayEnd.bind(this);
          video.onerror = (event: string | Event) => {
            this.videoError = 'Could not load video!';
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
          this.videoError = 'Couldn\'t find video - make sure it has been transcoded.';
        }

        this.framerate = 60;
        if (this.videoMeta.meta.metadata && this.videoMeta.meta.metadata.video) {
          const extra = this.videoMeta.meta.metadata.video;
          this.framerate = extra['frame-rate'];
        }
      }
    } else {
      this.video = null;
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
      if (this.lastVideo != null) {
        // clear data from the last video.
        // none yet
      }
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
