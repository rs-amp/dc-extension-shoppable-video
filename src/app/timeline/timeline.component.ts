import { Component, ElementRef, HostListener, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Point } from '../field/model/shoppable-video-data';
import { EditorService } from '../services/editor.service';
import { FieldService } from '../services/field.service';
import { VideoService } from '../services/video.service';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnInit, OnDestroy {

  rangeOffset = 0;
  rangeWidth = 1;
  width = 0;

  scrubberHeight = 10;
  timebarHeight = 16;
  barHeight = 48;
  hotspotHeight = 32;
  markerInset = 2;

  draggingMarker = false;
  draggingBackground = false;
  private lastPos?: number;

  get hotspotCount(): number {
    return this.field.data.hotspots.length;
  }

  get editorHeight(): number {
    return this.timelineHeight + this.barHeight;
  }

  get backgroundHeight(): number {
    return this.editorHeight - this.scrubberHeight;
  }

  get timelineHeight(): number {
    return (this.hotspotCount + 1.5) * this.hotspotHeight;
  }

  get markerPos(): number {
    return this.timebarHeight + this.scrubberHeight - this.markerInset;
  }

  get markerHeight(): number {
    return this.editorHeight - this.markerPos;
  }

  get backgroundCursor(): string {
    if (this.draggingBackground) {
      return 'grabbing';
    } else {
      return this.rangeWidth < 1 ? 'grab' : 'auto';
    }
  }

  private resizeBound!: () => void;

  constructor(private video: VideoService, public field: FieldService, private elementRef: ElementRef, public editor: EditorService) { }

  ngOnInit(): void {
    this.resizeBound = this.updateWidth.bind(this);
    window.addEventListener('resize', this.resizeBound);

    this.updateWidth();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeBound);
  }

  updateWidth() {
    this.width = this.elementRef.nativeElement.clientWidth;
  }

  getMarkerTranslation() {
    const duration = this.video.duration;
    const rangeOffsetS = this.rangeOffset * duration;
    const rangeWidthS = this.rangeWidth * duration;
    return `translate(${((this.video.currentTime - rangeOffsetS) / rangeWidthS) * this.width}px, 0)`;
  }

  getMarkerPct(event: PointerEvent): number {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();

    return Math.max(0, Math.min(1, (event.clientX - rect.x) / rect.width));
  }

  setMarker(event: PointerEvent): void {
    this.video.setCurrentTime((this.rangeOffset + this.getMarkerPct(event) * this.rangeWidth) * this.video.duration);
  }

  markerGrab(event: PointerEvent) {
    this.draggingMarker = true;
    (event.target as Element).setPointerCapture(event.pointerId);
    this.setMarker(event);
  }

  markerDrag(event: PointerEvent) {
    if (this.draggingMarker) {
      this.setMarker(event);
    }
  }

  markerRelease(event: PointerEvent) {
    if (this.draggingMarker) {
      this.setMarker(event);

      this.draggingMarker = false;
    }
  }

  backgroundGrab(event: PointerEvent) {
    if (this.rangeWidth < 1) {
      this.draggingBackground = true;
      (event.currentTarget as Element).setPointerCapture(event.pointerId);

      this.lastPos = this.getMarkerPct(event);
    }
  }

  backgroundDrag(event: PointerEvent) {
    if (this.draggingBackground) {
      const pos = this.getMarkerPct(event);

      if (this.lastPos) {
        const diff = pos - this.lastPos;

        this.rangeOffset -= diff * this.rangeWidth;

        if (this.rangeOffset < 0) { this.rangeOffset = 0; }
        if (this.rangeOffset + this.rangeWidth > 1) { this.rangeOffset = 1 - this.rangeWidth; }
      }

      this.lastPos = pos;
    }
  }

  backgroundRelease(event: PointerEvent) {
    if (this.draggingBackground) {
      if (this.lastPos) {
        const pos = this.getMarkerPct(event);
        const diff = pos - this.lastPos;

        this.rangeOffset -= diff * this.rangeWidth;

        if (this.rangeOffset < 0) { this.rangeOffset = 0; }
        if (this.rangeOffset + this.rangeWidth > 1) { this.rangeOffset = 1 - this.rangeWidth; }
      }

      this.draggingBackground = false;
    }
  }

  @HostListener('wheel', ['$event'])
  wheel(event: WheelEvent) {
    const maxZoom = 0.02;

    if (event.ctrlKey) {
      const factor = event.deltaY * 0.01;
      let newWidth = this.rangeWidth * (1 + factor);

      if (newWidth < maxZoom) { newWidth = maxZoom; }
      if (newWidth > 1) { newWidth = 1; }

      // Recenter the offset using the new width.
      const widthDiff = newWidth - this.rangeWidth;
      this.rangeWidth = newWidth;
      this.rangeOffset = this.rangeOffset - widthDiff / 2;
      if (this.rangeOffset < 0) { this.rangeOffset = 0; }
      if (this.rangeOffset + newWidth > 1) { this.rangeOffset = 1 - newWidth; }

      event.preventDefault();
    } else {
      // Disabled due to macOS page change nonsense.
      /*
      // Capture Delta X and translate into timeline scrolling.
      const pixelWidth = this.rangeWidth / this.width;

      this.rangeOffset += event.deltaX * pixelWidth;

      if (this.rangeOffset < 0) { this.rangeOffset = 0; }
      if (this.rangeOffset + this.rangeWidth > 1) { this.rangeOffset = 1 - this.rangeWidth; }

      event.preventDefault();
      */
    }
  }
}
