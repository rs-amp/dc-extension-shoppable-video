import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { VideoService } from 'src/app/services/video.service';

interface TimelineLine {
  pct: number;
  title: string;
}

const secondScales = [
  1/12, // 60 fps sub lines
  0.5,
  1,
  5,
  10,
  20,
  30,
  60,
  120
]

@Component({
  selector: 'app-timeline-background',
  templateUrl: './timeline-background.component.html',
  styleUrls: ['./timeline-background.component.scss']
})
export class TimelineBackgroundComponent implements OnInit, OnChanges {

  @Input('rangeOffset') rangeOffset!: number;
  @Input('rangeWidth') rangeWidth!: number;
  @Input('width') width!: number;
  @Input('scrolled') scrolled!: boolean;

  mainLines: TimelineLine[] = [];
  subLines: number[] = [];
  private decimalTitles = false;
  private dragTopBar = false;

  constructor(private video: VideoService, private ref: ElementRef) {
    this.video.videoChanged.subscribe(() => {
      this.updateZoom();
    });
  }

  ngOnInit(): void {
    this.updateZoom();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rangeOffset'] || changes['rangeWidth'] || changes['width']) {
      this.updateZoom();
    }
  }

  secondsToTitle(timeInSeconds: number): string {
    const minuteDiv = Math.floor(timeInSeconds / 60);
    const secondDiv = timeInSeconds % 60;

    const secondString = this.decimalTitles ? secondDiv.toFixed(2).padStart(5, '0') : Math.floor(secondDiv);
    return (minuteDiv == 0) ? `${secondString}s` : `${minuteDiv}:${secondString}s`;
  }

  updateZoom() {
    // The timeline background is simple in appearance, but is a bit tricky to set up.
    // First, we must determine the level of granularity for the "main" lines.
    // These are darker lines that have a time code in the header.

    // Determine how many line groups are needed to fill the timeline.

    // Four faint lines are placed between each main line to divide it into 5.

    const minMainDistance = 64;
    const clientWidth = this.width;
    const duration = this.video.duration;

    const rangeOffsetS = this.rangeOffset * duration;
    const rangeWidthS = this.rangeWidth * duration;

    let scaleIndex = 0;

    for (; scaleIndex < secondScales.length-1; scaleIndex++) {
      const scale = secondScales[scaleIndex];
      if (clientWidth / (rangeWidthS / scale) >= minMainDistance) {
        break;
      }
    }

    const scale = secondScales[scaleIndex];
    const numberOfLines = Math.ceil(rangeWidthS / scale) + 1;

    const lineStartTime = ((Math.floor(rangeOffsetS / scale)) * scale);
    const lineBase = (lineStartTime - rangeOffsetS) / rangeWidthS;
    const lineDist = scale / rangeWidthS;
    const sublineDist = lineDist / 5;

    this.mainLines = [];
    this.subLines = [];
    this.decimalTitles = scale < 1;

    let linePos = lineBase;
    let time = lineStartTime;
    for (let i=0; i<numberOfLines; i++) {
      this.mainLines.push({ pct: linePos, title: this.secondsToTitle(time) });

      for (let j=1; j<5; j++) {
        this.subLines.push(linePos + sublineDist * j);
      }

      time += scale;
      linePos += lineDist;
    }
  }

  getMainTranslation(line: TimelineLine) {
    const clientWidth = this.width;
    return `translate(${line.pct * clientWidth}px, 0)`;
  }

  getSubTranslation(line: number) {
    const clientWidth = this.width;
    return `translate(${line * clientWidth}px, 0)`;
  }

  getMarkerPct(event: PointerEvent): number {
    const rect = this.ref.nativeElement.getBoundingClientRect();

    return Math.max(0, Math.min(1, (event.clientX - rect.x) / rect.width));
  }

  setVideoTime(event: PointerEvent) {
    this.video.setCurrentTime((this.rangeOffset + this.getMarkerPct(event) * this.rangeWidth) * this.video.duration);
  }

  topGrab(event: PointerEvent) {
    this.dragTopBar = true;

    this.setVideoTime(event);

    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    event.stopPropagation();
  }

  topDrag(event: PointerEvent) {
    if (this.dragTopBar) {
      this.setVideoTime(event);
    }
  }

  topRelease(event: PointerEvent) {
    this.dragTopBar = false;
  }

}
