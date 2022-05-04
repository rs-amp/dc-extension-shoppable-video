import { Component, OnInit } from '@angular/core';
import { VideoService } from 'src/app/services/video.service';

const advanceHoldDelay = 400;
const advanceHoldInterval = 200;

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

  get muted(): boolean {
    return (this.video.video && this.video.video.muted) || false;
  }

  advancing = false;
  advanceDirection = false;
  advanceInterval = -1;
  advanceLoopBind: () => void;

  constructor(private video: VideoService) {
    this.advanceLoopBind = this.advanceLoop.bind(this);
  }

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

  mute() {
    if (this.video.video) {
      this.video.video.muted = !this.video.video.muted;
    }
  }

  muteKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.mute();
    }
  }

  frameAdvance(frames: number, fromButton: boolean) {
    if (fromButton && this.advancing) {
      return;
    }

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

  clearAdvanceInterval() {
    if (this.advanceInterval !== -1) {
      clearTimeout(this.advanceInterval);

      this.advanceInterval = -1;
    }
  }

  advanceButtonDown(event: PointerEvent, advance: boolean) {
    this.advancing = false;
    this.advanceDirection = advance;
    this.clearAdvanceInterval();

    this.advanceInterval = window.setTimeout(() => {
      this.advancing = true;

      this.advanceLoop();
    }, advanceHoldDelay);

    (event.currentTarget as Element).setPointerCapture(event.pointerId);
  }

  advanceButtonUp(event: PointerEvent, advance: boolean) {
    this.clearAdvanceInterval();
  }

  advanceLoop() {
    this.frameAdvance(this.advanceDirection ? 1 : -1, false);

    this.advanceInterval = window.setTimeout(this.advanceLoopBind, advanceHoldInterval);
  }
}
