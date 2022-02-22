import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { VideoService } from '../services/video.service';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements OnInit {
  @Input('enabled') enabled!: boolean;
  @ViewChild('video', {static: false}) videoElem!: ElementRef<HTMLVideoElement>;

  constructor(private dvideo: VideoService) { }

  ngOnInit(): void {
    this.dvideo.videoUIProvider = this.getVideoElem.bind(this);
  }

  public getVideoElem(): Promise<HTMLVideoElement> {
    // It's possible that the video element has not been created yet.
    // If we're calling this function, we should be in a state where angular will create it.
    // Just wait a few frames until it does.
    return new Promise((resolve, reject) => {
      if (this.videoElem == null) {
        let continueFunc: () => void;
        continueFunc = () => {
          if (this.videoElem == null) {
            requestAnimationFrame(continueFunc);
          } else {
            resolve(this.videoElem.nativeElement);
          }
        };
        requestAnimationFrame(continueFunc);
      } else {
        resolve(this.videoElem.nativeElement);
      }
    });
  }
}
