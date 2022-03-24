import { Component, OnInit } from '@angular/core';
import { VideoService } from 'src/app/services/video.service';

@Component({
  selector: 'app-player-controls',
  templateUrl: './player-controls.component.html',
  styleUrls: ['./player-controls.component.scss']
})
export class PlayerControlsComponent implements OnInit {

  get paused(): boolean {
    return (this.video.video && this.video.video.paused) || false;
  }

  get volume(): number {
    return (this.video.video && this.video.video.volume) || 0;
  }

  constructor(private video: VideoService) { }

  ngOnInit(): void {
  }

  togglePlay(): void {
    if (this.video.video) {
      if (this.paused) {
        this.video.video.play();
      } else {
        this.video.video.pause();
      }
    }
  }

  setVolume(value: number | null): void {
    if (this.video.video && value !== null) {
      this.video.video.volume = value;
    }
  }

  getVolumeIcon(): string {
    if (this.video.video) {
      if (this.video.video.muted) {
        return 'volume_off';
      } else if (this.volume == 0) {
        return 'volume_mute'
      } else if (this.volume < 0.5) {
        return 'volume_down'
      } else {
        return 'volume_up';
      }
    }

    return 'volume_up';
  }

  frameAdvance(frames: number) {
    if (this.video.video && this.video.framerate) {
      if (!this.paused) {
        this.video.video.pause();
      }

      this.video.changeCurrentTime(frames / this.video.framerate);
    }
  }

  skipPrevious() {
    if (this.video.video) {
      this.video.setCurrentTime(0);
    }
  }

  skipNext() {
    if (this.video.video) {
      this.video.setCurrentTime(this.video.video.duration);
    }
  }

}
