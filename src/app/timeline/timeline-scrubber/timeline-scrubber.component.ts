import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { VideoService } from 'src/app/services/video.service';

enum DragTarget {
  None,
  Time,
  ZoomStart,
  ZoomEnd
}

@Component({
  selector: 'app-timeline-scrubber',
  templateUrl: './timeline-scrubber.component.html',
  styleUrls: ['./timeline-scrubber.component.scss']
})
export class TimelineScrubberComponent implements OnInit {

  get progress(): number {
    return (this.video.video && (this.video.currentTime / this.video.video.duration)) || 0;
  }

  get timestamp(): string {
    const timeInSeconds = (this.video.video && this.video.currentTime) || 0;

    const minuteDiv = Math.floor(timeInSeconds / 60);
    const secondDiv = timeInSeconds % 60;
    return `${minuteDiv}:${secondDiv.toFixed(2).padStart(5, '0')}`;
  }

  @ViewChild('bar', {static: false}) barElem!: ElementRef<HTMLDivElement>;

  @Input('rangeOffset') rangeOffset!: number;
  @Input('rangeWidth') rangeWidth!: number;

  @Output('rangeOffsetChange') rangeOffsetChange = new EventEmitter<number>();
  @Output('rangeWidthChange') rangeWidthChange = new EventEmitter<number>();

  private wasPaused = false;
  private drag = DragTarget.None;

  constructor(private video: VideoService) { }

  ngOnInit(): void {
  }

  beginDrag(event: PointerEvent): void {
    if (this.drag === DragTarget.None) {
      this.drag = DragTarget.Time;
      (event.target as Element).setPointerCapture(event.pointerId);

      this.wasPaused = this.video.video?.paused || false;
      this.video.video?.pause();
    }
  }

  getBarPct(event: PointerEvent): number {
    const barRect = this.barElem.nativeElement.getBoundingClientRect();

    return Math.max(0, Math.min(1, (event.clientX - barRect.x) / barRect.width));
  }

  setSeek(event: PointerEvent): void {
    const pct = this.getBarPct(event);

    if (this.video.video) {
      this.video.setCurrentTime(this.video.video.duration * pct);
    }
  }

  endDrag(event: PointerEvent): void {
    if (this.drag === DragTarget.Time) {
      this.drag = DragTarget.None;
      this.setSeek(event);

      if (!this.wasPaused) {
        this.video.video?.play();
      }
    }
  }

  moveDrag(event: PointerEvent): void {
    if (this.drag === DragTarget.Time) {
      this.setSeek(event);
    }
  }

  setRange(event: PointerEvent, mode: DragTarget) {
    const pct = this.getBarPct(event);
    const maxZoom = 0.05;

    switch (mode) {
      case DragTarget.ZoomStart:
        const currentEnd = this.rangeOffset + this.rangeWidth;
        const newStart = Math.min(pct, currentEnd - maxZoom);

        this.rangeOffset = newStart;
        this.rangeWidth = currentEnd - newStart;
        break;
      case DragTarget.ZoomEnd:
        const newEnd = Math.max(pct, this.rangeOffset + maxZoom);

        this.rangeWidth = newEnd - this.rangeOffset;
        break;
    }

    this.rangeOffsetChange.emit(this.rangeOffset);
    this.rangeWidthChange.emit(this.rangeWidth);
  }

  beginRange(event: PointerEvent, isEnd: boolean) {
    const mode = isEnd ? DragTarget.ZoomEnd : DragTarget.ZoomStart;
    if (this.drag === DragTarget.None) {
      this.drag = mode;
      (event.target as Element).setPointerCapture(event.pointerId);
      this.setRange(event, mode);
    }
  }

  moveRange(event: PointerEvent, isEnd: boolean) {
    const mode = isEnd ? DragTarget.ZoomEnd : DragTarget.ZoomStart;

    if (this.drag === mode) {
      this.setRange(event, mode);
    }
  }

  endRange(event: PointerEvent, isEnd: boolean) {
    const mode = isEnd ? DragTarget.ZoomEnd : DragTarget.ZoomStart;

    if (this.drag === mode) {
      this.setRange(event, mode);

      this.drag = DragTarget.None;
    }
  }

}
