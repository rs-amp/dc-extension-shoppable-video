import { Component, ElementRef, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
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

  private resizeBound!: () => void;

  constructor(private video: VideoService, public field: FieldService, private elementRef: ElementRef) { }

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
}
