import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MediaImageLink } from 'dc-extensions-sdk/dist/types/lib/components/MediaLink';
import { VideoSelection } from '../field/extension-sdk.service';
import { ThemeService } from '../services/theme.service';

const blankThumb = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

@Component({
  selector: 'app-video-select-dialog',
  templateUrl: './video-select-dialog.component.html',
  styleUrls: ['./video-select-dialog.component.scss'],
})
export class VideoSelectDialogComponent implements OnInit {
  get hasVideos(): boolean {
    return !this.videos || this.videos.length > 0;
  }

  get themeName(): string {
    return `app-theme--${this.theme.activeTheme}`;
  }

  constructor(
    private dialogRef: MatDialogRef<VideoSelectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public videos: VideoSelection[],
    private theme: ThemeService
  ) {}

  ngOnInit(): void {}

  generateVideoThumb(video: VideoSelection): string {
    if (video.data == null) {
      return blankThumb;
    }

    const link = video.data.video as MediaImageLink;

    if (link.name == null) {
      return blankThumb;
    }

    return `https://${link.defaultHost}/v/${link.endpoint}/${encodeURIComponent(
      link.name
    )}`;
  }

  getVideoTitle(video: VideoSelection): string {
    return video.title ?? video.path;
  }

  getVideoSubtitle(video: VideoSelection): string {
    return video.description ?? (video.title ? video.path : '');
  }

  selectVideo(video: VideoSelection): void {
    this.dialogRef.close(video);
  }
}
