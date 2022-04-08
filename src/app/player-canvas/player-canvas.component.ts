import { ContentObserver } from '@angular/cdk/observers';
import {
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import {
  Point,
  ShoppableVideoCallToAction,
  ShoppableVideoData,
  ShoppableVideoHotspot,
  ShoppableVideoTimePoint,
} from '../field/model/shoppable-video-data';
import { EditorCommandsService } from '../services/editor-commands.service';
import {
  AddKeyframeCommand,
  MoveKeyframeCtaCommand,
  MoveKeyframePositionCommand,
} from '../services/editor-commands/keyframe-commands';
import { EditorMode, EditorService } from '../services/editor.service';
import { FieldService } from '../services/field.service';
import { ScreenService } from '../services/screen.service';
import { VideoService } from '../services/video.service';
import { CanvasCtaComponent } from './canvas-cta/canvas-cta.component';

interface TransformedCta {
  entity: ShoppableVideoCallToAction;
  transform: string;
  lineTransform: string;
  width: string;
}

interface TransformedHotspot {
  visible: boolean;
  selected: boolean;
  transform: string;
  cta?: TransformedCta;
}

interface TransformedLine {
  lineTransform: string;
  width: string;
}

interface TransformedKeyframe {
  visible: boolean;
  transform: string;
  line?: TransformedLine;
}

@Component({
  selector: 'app-player-canvas',
  templateUrl: './player-canvas.component.html',
  styleUrls: ['./player-canvas.component.scss'],
})
export class PlayerCanvasComponent implements OnInit {

  @Input('vis') vis?: boolean;

  hotspotTransforms: TransformedHotspot[] = [];
  keyframeTransforms: TransformedKeyframe[] = [];
  videoWidth!: number;
  videoHeight!: number;
  cursor = 'default';

  private dragIndex = -1;
  private relativeDrag: Point = { x: 0, y: 0 };
  private oldPosition: Point | undefined;

  private ctaDragIndex = -1;
  private ctaDragRelative: Point = { x: 0, y: 0 };
  private ctaOldPosition: Point | undefined;

  private sizeAdjusting = false;
  private sizeAdjustTimeout = -1;

  private tooltipShow = false;
  private firstPlaceTooltip = false;
  private lastTooltip = '';

  @ViewChild('container', { static: false })
  containerElem!: ElementRef<HTMLDivElement>;

  @ViewChild('tooltip', { static: false })
  tooltip!: MatTooltip;

  constructor(
    public field: FieldService,
    public video: VideoService,
    public screen: ScreenService,
    public editor: EditorService,
    private commands: EditorCommandsService,
    private host: ElementRef,
    private ref: ApplicationRef
  ) {
    field.fieldUpdated.subscribe((data) => {
      this.updateTransforms(data, true);
    });

    video.videoProgress.subscribe((time) => {
      this.updateTransforms(field.data);
    });

    screen.sizeUpdated.subscribe((_) => {
      this.updateVideoSize();
      this.updateTransforms(field.data, true);
    });

    video.videoChanged.subscribe((video) => {
      this.updateVideoSize();
    });

    editor.selectionChanged.subscribe((_) => {
      this.firstPlaceTooltip = false;
      this.updateTransforms(field.data, true);
    });

    editor.modeChange.subscribe(() => {
      if (this.sizeAdjustTimeout !== -1) {
        clearTimeout(this.sizeAdjustTimeout);
      }

      this.sizeAdjusting = true;
      this.sizeAdjustTimeout = window.setTimeout(
        this.clearSizeAdjust.bind(this),
        1000
      );
      this.sizeAdjust();
    });

    this.updateVideoSize();
    this.updateTransforms(field.data, true);
  }

  sizeAdjust() {
    this.updateVideoSize();
    this.updateTransforms(this.field.data, true);

    if (this.sizeAdjusting) {
      requestAnimationFrame(this.sizeAdjust.bind(this));
    }
  }

  clearSizeAdjust() {
    this.sizeAdjustTimeout = -1;

    this.sizeAdjusting = false;
  }

  updateVideoSize() {
    const vidHeight = this.host.nativeElement.clientHeight;

    const videoWidth = this.video.video?.videoWidth ?? 500;
    const videoHeight = this.video.video?.videoHeight ?? 500;

    const videoAspect = videoWidth / videoHeight;
    const canvasAspect = this.host.nativeElement.clientWidth / vidHeight;

    if (videoAspect > canvasAspect) {
      // Constrained by width.

      this.videoWidth = this.host.nativeElement.clientWidth;
      this.videoHeight = this.videoWidth / videoAspect;
    } else {
      // Constrained by height.

      this.videoWidth = vidHeight * videoAspect;
      this.videoHeight = vidHeight;
    }
  }

  transformFromPoint(p: Point): string {
    const xScale = this.videoWidth;
    const yScale = this.videoHeight;
    return `translate(${p.x * xScale}px, ${p.y * yScale}px)`;
  }

  getMouse(event: PointerEvent): Point {
    const bound = this.containerElem.nativeElement.getBoundingClientRect();

    const xScale = this.videoWidth;
    const yScale = this.videoHeight;

    return {
      x: (event.clientX - bound.x) / xScale,
      y: (event.clientY - bound.y) / yScale,
    };
  }

  pointLerp(
    p1: ShoppableVideoTimePoint,
    p2: ShoppableVideoTimePoint,
    t: number
  ): Point {
    const fac = (t - p1.t) / (p2.t - p1.t);
    const inv = 1 - fac;

    return {
      x: fac * p2.p.x + inv * p1.p.x,
      y: fac * p2.p.y + inv * p1.p.y,
    };
  }

  getHotspotPoint(hotspot: ShoppableVideoHotspot): Point | undefined {
    // Determine the range which we're in on the hotspot timeline.
    const time = this.video.currentTime;
    const timeline = hotspot.timeline.points;

    if (timeline.length == 0 || timeline[0].t > time) {
      return undefined;
    }

    let previous = timeline[0];

    for (let i = 1; i < timeline.length; i++) {
      const point = timeline[i];

      if (point.t >= time) {
        if (previous.e) {
          return undefined;
        } else {
          return this.pointLerp(previous, point, time);
        }
      }

      previous = point;
    }

    if (previous.e && time > previous.t) {
      return undefined;
    } else {
      return previous.p;
    }
  }

  getHotspotCta(hotspot: ShoppableVideoHotspot): Point {
    // Find the latest cta position that is behind or equal to the current time.
    const time = this.video.currentTime;
    const timeline = hotspot.timeline.points;

    let point: Point | undefined;

    for (let i = timeline.length - 1; i >= 0; i--) {
      const point = timeline[i];

      if (point.t <= time && point.cta && point.cta.x && point.cta.y) {
        return point.cta;
      }
    }

    // If there is no timepoint behind or equal to the current time (invald state?), just return the midpoint.
    return { x: 0.5, y: 0.5 };
  }

  setHotspotCtaVisual(hotspot: ShoppableVideoHotspot, visual: Point): number {
    // Find the latest timepoint that is behind the current position,
    // and is either prefaced by a hidden timepoint or nothing.
    const time = this.video.currentTime;
    const timeline = hotspot.timeline.points;

    for (let i = timeline.length - 1; i >= 0; i--) {
      const point = timeline[i];

      if (point.t <= time && (i == 0 || (!point.e && timeline[i - 1].e))) {
        point.cta = visual;
        return i;
      }
    }

    return -1;
  }

  getTransform(hotspot: ShoppableVideoHotspot): TransformedHotspot {
    const point = this.getHotspotPoint(hotspot);

    if (point === undefined) {
      return { visible: false, selected: false, transform: '' };
    } else {
      const ctaEntity = hotspot.cta;
      const transform = this.transformFromPoint(point);
      const selected = this.editor.selectedHotspot == hotspot;

      let cta: TransformedCta | undefined;
      if (ctaEntity) {
        const ctaPoint = this.getHotspotCta(hotspot);
        const ctaTransform = this.transformFromPoint(ctaPoint);

        const vec = {
          x: (ctaPoint.x - point.x) * this.videoWidth,
          y: (ctaPoint.y - point.y) * this.videoHeight,
        };

        const width = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
        const rotate = Math.atan2(vec.y, vec.x);

        cta = {
          entity: ctaEntity,
          transform: ctaTransform,
          lineTransform: transform + ` rotate(${rotate}rad)`,
          width: width + 'px',
        };
      }

      return { visible: true, selected, transform, cta };
    }
  }

  shouldShowTooltip() : boolean {
    return this.editor.editorMode === EditorMode.Edit && !this.editor.dialogOpen && (
           this.firstPlaceTooltip ||
           this.field.data.hotspots.length == 0 ||
           this.editor.selectedHotspot == null ||
           this.editor.selectedHotspot.timeline.points.length == 0);
  }

  getHelpTooltip() : string {
    let tooltip: string;
    if (this.field.data.hotspots.length == 0) {
      tooltip = 'Add a hotspot below to get started.';
    } else if (this.editor.selectedHotspot == null) {
      tooltip = 'Select any hotspot to place on the canvas.';
    } else if (this.editor.selectedHotspot.timeline.points.length == 0) {
      tooltip = 'Click anywhere on the canvas to place the hotspot at the current point in time.';
    } else {
      tooltip = this.lastTooltip;
    }

    if (tooltip !== this.lastTooltip) {
      this.tooltipShow = false;

      this.lastTooltip = tooltip;
    }

    return this.lastTooltip;
  }

  updateTransforms(data: ShoppableVideoData, keyframes = false) {
    this.hotspotTransforms = data.hotspots.map((hotspot) =>
      this.getTransform(hotspot)
    );

    if (keyframes && this.editor.selectedHotspot != null) {
      const hotspot = this.editor.selectedHotspot;
      const points = hotspot.timeline.points;

      const result: TransformedKeyframe[] = [];
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const transform = this.transformFromPoint(point.p);

        let line: TransformedLine | undefined;
        if (!point.e && i != points.length - 1) {
          const point2 = points[i + 1];

          const vec = {
            x: (point2.p.x - point.p.x) * this.videoWidth,
            y: (point2.p.y - point.p.y) * this.videoHeight,
          };

          const width = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
          const rotate = Math.atan2(vec.y, vec.x);

          line = {
            lineTransform: transform + ` rotate(${rotate}rad)`,
            width: width + 'px',
          };
        }

        result.push({
          visible: true,
          transform: transform + ' rotate(45deg)',
          line,
        });
      }

      this.keyframeTransforms = result;
    }

    setTimeout(() => this.ref.tick(), 0);

    this.updateTooltip();
  }

  updateTooltip() {
    const tooltipShow = this.shouldShowTooltip();

    if (this.tooltipShow !== tooltipShow && this.tooltip) {
      this.tooltipShow = tooltipShow;

      if (this.tooltipShow) {
        this.tooltip.show();
      } else {
        this.tooltip.hide();
      }
    }
  }

  getKeyframeOpacity(index: number, line = false) {
    const hotspot = this.editor.selectedHotspot as ShoppableVideoHotspot;
    const points = hotspot.timeline.points;
    let pos: number;

    if (line) {
      pos = (points[index].t + points[index + 1].t) / 2;
    } else {
      pos = points[index].t;
    }

    const dist = Math.abs(this.video.currentTime - pos);

    return Math.max(0, Math.min(0.75, 1 - dist));
  }

  ngOnInit(): void {}

  setFirstPlaceHint(): void {
    // This tooltip needs to show after a mouse up.
    const action = (() => {
      setTimeout(() => {
        this.lastTooltip = 'To record motion, move the video scrubber then click and drag the hotspot to create additional keyframes at other points in time.';

        this.firstPlaceTooltip = true;
        this.tooltipShow = false;
        this.updateTooltip();
      }, 100);
      window.removeEventListener('mouseup', action);
    }).bind(this);

    window.addEventListener('mouseup', action);
  }

  pointNearMouse(mousePos: Point, point: Point): number {
    const aspect = this.videoWidth / this.videoHeight;

    const diffX = (mousePos.x - point.x) * aspect;
    const diffY = mousePos.y - point.y;

    const distanceSquared = diffX * diffX + diffY * diffY;
    const pointDistance = 32 / this.videoHeight;

    return distanceSquared < pointDistance * pointDistance
      ? distanceSquared
      : Infinity;
  }

  pointerDown(event: PointerEvent) {
    if (this.vis) {
      // Don't do anything if this is the visualization.
      return;
    }

    // Determine what point we're near. Prefer the currently selected one.

    let nearest: ShoppableVideoHotspot | undefined;
    let nearestDist = Infinity;

    const mousePos = this.getMouse(event);

    const hotspots = this.field.data.hotspots;
    for (let i = 0; i < hotspots.length; i++) {
      const point = this.getHotspotPoint(hotspots[i]);
      if (point) {
        const dist = this.pointNearMouse(mousePos, point);

        if (dist < nearestDist) {
          nearest = hotspots[i];
        }
      }
    }

    if (nearest !== undefined && nearest !== this.editor.selectedHotspot) {
      this.editor.select(nearest);
    }

    // If there's no active selected hotspot, do nothing.
    if (this.editor.selectedHotspot === undefined) {
      return;
    }

    const hotspot = this.editor.selectedHotspot;
    const point = this.getHotspotPoint(hotspot);

    // If the hotspot is invisible at the current point, or the mouse is clicked nearby, begin dragging.
    if (point === undefined || nearest == hotspot) {
      // Set relative dragging position.
      this.relativeDrag =
        point == undefined
          ? { x: 0, y: 0 }
          : { x: point.x - mousePos.x, y: point.y - mousePos.y };

      // Should this move an existing timepoint, or add a new one?
      let { timepoint, exact } = this.editor.findNearestTimepoint(
        hotspot,
        this.video.currentTime
      );

      // TODO: quantize current time?

      this.firstPlaceTooltip = false;

      if (!exact) {
        // Place a new timepoint with the interpolated position or mouse position.
        const newPoint: ShoppableVideoTimePoint = {
          t: this.video.currentTime,
          p: point || mousePos,
        };

        if (timepoint == hotspot.timeline.points.length - 1) {
          newPoint.e = true;
        }

        if (hotspot.timeline.points.length == 0) {
          this.setFirstPlaceHint();
        } else {
        }

        this.commands.runCommand(
          new AddKeyframeCommand(hotspot, newPoint, ++timepoint)
        );
        this.oldPosition = undefined;
      } else {
        this.oldPosition = hotspot.timeline.points[timepoint].p;
      }

      this.dragIndex = timepoint;
      this.containerElem.nativeElement.setPointerCapture(event.pointerId);
    }
  }

  modeDraggedKeypoint(event: PointerEvent) {
    if (this.dragIndex !== -1 && this.editor.selectedHotspot) {
      // Move the dragged keypoint.

      const hotspot = this.editor.selectedHotspot;
      const mousePos = this.getMouse(event);
      const point = hotspot.timeline.points[this.dragIndex];

      point.p = {
        x: Math.max(0, Math.min(1, mousePos.x + this.relativeDrag.x)),
        y: Math.max(0, Math.min(1, mousePos.y + this.relativeDrag.y)),
      };

      this.updateTransforms(this.field.data, true);
    }
  }

  pointerMove(pointer: PointerEvent) {
    let newCursor = 'default';
    if (this.dragIndex !== -1) {
      newCursor = 'grabbing';
      this.modeDraggedKeypoint(pointer);
    } else if (this.ctaDragIndex !== -1) {
      newCursor = 'grabbing';
      const position = this.getMouse(pointer);
      const hotspot = this.field.data.hotspots[this.ctaDragIndex];

      const delta = {
        x: position.x - this.ctaDragRelative.x,
        y: position.y - this.ctaDragRelative.y,
      };

      if (delta.x !== 0 || delta.y !== 0) {
        // Move the cta by the relative position
        const cta = this.getHotspotCta(hotspot);

        const ctaVisual = { x: cta.x + delta.x, y: cta.y + delta.y };

        // Locate and update the relevant cta for the current timepoint.
        this.setHotspotCtaVisual(hotspot, ctaVisual);
        this.updateTransforms(this.field.data);
      }

      this.ctaDragRelative = position;
    } else {
      const mousePos = this.getMouse(pointer);

      // If the hotspot is invisible at the current point, or the mouse is clicked near any hotspot, begin dragging.
      let nearMouse = false;
      const hotspots = this.field.data.hotspots;

      for (let i = 0; i < hotspots.length; i++) {
        const point = this.getHotspotPoint(hotspots[i]);
        if (
          point !== undefined &&
          this.pointNearMouse(mousePos, point) < Infinity
        ) {
          nearMouse = true;
          break;
        }
      }

      if (nearMouse) {
        newCursor = 'grab';
      } else if (
        this.editor.selectedHotspot !== undefined &&
        this.getHotspotPoint(this.editor.selectedHotspot) === undefined
      ) {
        newCursor = 'copy';
      }
    }

    if (this.cursor != newCursor) {
      this.cursor = newCursor;
    }
  }

  pointerUp(pointer: PointerEvent) {
    const hotspot = this.editor.selectedHotspot;
    if (hotspot) {
      if (this.dragIndex !== -1) {
        // Release the dragged keypoint.
        this.modeDraggedKeypoint(pointer);

        if (this.oldPosition) {
          this.commands.runCommand(
            new MoveKeyframePositionCommand(
              hotspot,
              this.dragIndex,
              this.oldPosition,
              hotspot.timeline.points[this.dragIndex].p
            )
          );
        } else {
          this.field.updateField();
        }

        this.dragIndex = -1;
      } else if (this.ctaDragIndex !== -1) {
        this.commands.runCommand(
          new MoveKeyframeCtaCommand(
            hotspot,
            this.ctaDragIndex,
            this.ctaOldPosition,
            hotspot.timeline.points[this.ctaDragIndex].cta
          )
        );

        this.ctaDragIndex = -1;
      }
    }
  }

  ctaDown(element: CanvasCtaComponent, index: number, pointer: PointerEvent) {
    if (this.vis) {
      // Can't drag cta from the vis.
      return;
    }

    this.ctaDragIndex = index;
    this.ctaDragRelative = this.getMouse(pointer);

    //debugger;
    element.ref.nativeElement.setPointerCapture(pointer.pointerId);
    //(pointer.currentTarget as HTMLElement).setPointerCapture(pointer.pointerId);

    pointer.stopImmediatePropagation();
    pointer.preventDefault();

    this.editor.select(this.field.data.hotspots[this.ctaDragIndex]);
  }

  trackTransform(index: number, transform: TransformedHotspot): string {
    return `${index}`;
  }
}
