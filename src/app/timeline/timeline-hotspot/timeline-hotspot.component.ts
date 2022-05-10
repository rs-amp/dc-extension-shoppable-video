import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  ShoppableVideoHotspot,
  ShoppableVideoTimePoint,
} from 'src/app/field/model/shoppable-video-data';
import { EditorCommandsService } from 'src/app/services/editor-commands.service';
import {
  MoveKeyframeCommand,
  ToggleKeyframeEndCommand,
} from 'src/app/services/editor-commands/keyframe-commands';
import { EditorService } from 'src/app/services/editor.service';
import { FieldService } from 'src/app/services/field.service';
import { VideoService } from 'src/app/services/video.service';

@Component({
  selector: 'app-timeline-hotspot',
  templateUrl: './timeline-hotspot.component.html',
  styleUrls: ['./timeline-hotspot.component.scss'],
})
export class TimelineHotspotComponent implements OnInit, OnChanges, OnDestroy {
  @Input('rangeOffset') rangeOffset!: number;
  @Input('rangeWidth') rangeWidth!: number;
  @Input('width') width!: number;
  @Input('hotspot') hotspot!: ShoppableVideoHotspot;

  renderablePoints: ShoppableVideoTimePoint[] = [];
  startIndex = 0;
  totalPoints = 0;
  clickedKeyframe: number = -1;
  clickedOffset: number = 0;
  startTimepoint: number = 0;
  dragActive = false;
  clickTimeout?: number;

  showLineTooltip = false;
  showLineVisible = true;
  showLineIndex = -1;

  constructor(
    private video: VideoService,
    public editor: EditorService,
    private commands: EditorCommandsService,
    private elementRef: ElementRef,
    private field: FieldService
  ) {
    this.video.videoChanged.subscribe(() => {
      this.updateZoom();
    });

    this.field.fieldUpdated.subscribe(() => {
      this.updateZoom();
    });
  }

  ngOnInit(): void {
    this.updateZoom();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rangeOffset'] || changes['rangeWidth']) {
      this.updateZoom();
    }
  }

  ngOnDestroy(): void {
    this.clearClickTimeout();
  }

  clearClickTimeout(): void {
    if (this.clickTimeout != null) {
      clearTimeout(this.clickTimeout);
      this.clickTimeout = undefined;
    }
  }

  updateZoom() {
    let startIndex = -1;
    let endIndex = -1;

    const duration = this.video.duration;

    const rangeOffsetS = this.rangeOffset * duration;
    const rangeWidthS = this.rangeWidth * duration;
    const rangeEndS = rangeOffsetS + rangeWidthS;

    const points = this.hotspot.timeline.points;

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (point.t >= rangeOffsetS && point.t <= rangeEndS) {
        if (startIndex == -1) {
          startIndex = i;
        }

        endIndex = i;
      }
    }

    if (startIndex != -1) {
      startIndex = Math.max(0, startIndex - 1);

      this.renderablePoints = points.slice(startIndex, endIndex + 1);
    } else if (points.length > 0) {
      startIndex = points.length - 1;
      this.renderablePoints = [points[points.length - 1]];
    } else {
      this.renderablePoints = [];
    }

    this.startIndex = startIndex;
    this.totalPoints = points.length;
  }

  selected(index: number): boolean {
    return (
      this.editor.selectedHotspot === this.hotspot &&
      this.editor.selectedTimepoint === index
    );
  }

  getPointX(point: ShoppableVideoTimePoint) {
    const duration = this.video.duration;
    const rangeOffsetS = this.rangeOffset * duration;
    const rangeWidthS = this.rangeWidth * duration;
    return ((point.t - rangeOffsetS) / rangeWidthS) * this.width;
  }

  getPointTranslation(point: ShoppableVideoTimePoint) {
    return `translate(${this.getPointX(point)}px, 0) rotate(45deg)`;
  }

  getLineTranslation(point: ShoppableVideoTimePoint, index: number) {
    const duration = this.video.duration;
    const rangeOffsetS = this.rangeOffset * duration;
    const rangeWidthS = this.rangeWidth * duration;
    const dist =
      index === this.renderablePoints.length - 1
        ? 1
        : (this.renderablePoints[index + 1].t - point.t) / rangeWidthS;
    const distPx = dist * this.width;
    const xScale = distPx / 100;
    const linePosOffset = ((point.t - rangeOffsetS) / rangeWidthS) * this.width;

    return `translate(-50px, 0) scale(${xScale}, 1) translate(${
      linePosOffset / xScale + 50
    }px, 0)`;
  }

  setPointX(point: ShoppableVideoTimePoint, xPos: number) {
    // Get the min+max position for this point.
    const points = this.hotspot.timeline.points;
    const index = points.indexOf(point);
    const min = index == 0 ? 0 : points[index - 1].t + 1 / this.video.framerate;
    const max =
      index == points.length - 1
        ? this.video.duration
        : points[index + 1].t - 1 / this.video.framerate;

    // Convert xPos back into time.

    const duration = this.video.duration;
    const rangeOffsetS = this.rangeOffset * duration;
    const rangeWidthS = this.rangeWidth * duration;

    point.t = Math.min(
      max,
      Math.max(min, (xPos / this.width) * rangeWidthS + rangeOffsetS)
    );

    this.video.forceRedraw();
  }

  getMousePosition(event: PointerEvent): number {
    const rect = (
      this.elementRef.nativeElement as Element
    ).getBoundingClientRect();

    return Math.max(0, Math.min(event.clientX - rect.x, rect.width));
  }

  keyframeDown(event: PointerEvent, index: number) {
    const beginDragMs = 500;
    // Select the hotspot at the given time.

    this.clickedKeyframe = index;
    this.editor.select(this.hotspot, index);

    // Start moving the keyframe after a set amount of time, or if the mouse is moved considerably.

    this.clearClickTimeout();
    this.dragActive = false;

    const point = this.hotspot.timeline.points[index];
    const mPos = this.getMousePosition(event);
    const tPos = this.getPointX(point);
    this.startTimepoint = point.t;

    this.clickedOffset = mPos - tPos;

    this.clickTimeout = setTimeout(
      this.beginDrag.bind(this),
      beginDragMs
    ) as any;

    (event.target as Element).setPointerCapture(event.pointerId);
  }

  beginDrag() {
    this.dragActive = true;
  }

  keyframeMove(event: PointerEvent, index: number) {
    // Only run if a keyframe is clicked.

    if (this.clickedKeyframe === index) {
      const mPos = this.getMousePosition(event);
      const point = this.hotspot.timeline.points[index];

      // Don't move the keyframe unless the drag has started.
      if (!this.dragActive) {
        // Is the mouse far enough away from the initial click point?

        const dragThreshold = 7;

        const tPos = this.getPointX(this.hotspot.timeline.points[index]);
        const newOffset = mPos - tPos;

        if (Math.abs(newOffset - this.clickedOffset) > dragThreshold) {
          this.clearClickTimeout();
          this.beginDrag();
        } else {
          return;
        }
      }

      // Move the keyframe to the mouse.

      this.setPointX(point, mPos);
    }
  }

  keyframeUp(event: PointerEvent, index: number) {
    // If the hotspot was not moved,
    if (this.clickedKeyframe === index) {
      const point = this.hotspot.timeline.points[index];
      if (this.dragActive) {
        // Send the new timepoint position as a command.
        this.setPointX(point, this.getMousePosition(event));

        this.commands.runCommand(
          new MoveKeyframeCommand(
            this.hotspot,
            index,
            this.startTimepoint,
            point.t
          )
        );
        this.dragActive = false;
      } else {
        // Quick click, just move the video currentTime to this position.
        this.video.setCurrentTime(point.t);
      }
      this.clickedKeyframe = -1;
    }

    this.clearClickTimeout();
  }

  lineClick(index: number) {
    this.commands.runCommand(new ToggleKeyframeEndCommand(this.hotspot, index));

    if (index == this.showLineIndex) {
      this.showLineVisible = !this.hotspot.timeline.points[index].e;
    }
  }

  lineHover(index: number) {
    this.showLineIndex = index;
    this.showLineTooltip = true;
    this.showLineVisible = !this.hotspot.timeline.points[index].e;
  }

  lineOut(index: number) {
    this.showLineTooltip = false;
  }

  getShowHideTranslation() {
    const points = this.hotspot.timeline.points;
    if (this.showLineIndex == -1 || this.showLineIndex >= points.length - 1) {
      this.showLineTooltip = false;
      return `scale(0, 0)`;
    }

    const x1 = this.getPointX(points[this.showLineIndex]);
    const x2 = this.getPointX(points[this.showLineIndex + 1]);

    return `translate(${(x1 + x2) / 2}px, 0)`;
  }
}
