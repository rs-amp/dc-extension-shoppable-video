import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  Point,
  ShoppableVideoData,
  ShoppableVideoHotspot,
  ShoppableVideoTimePoint,
} from '../field/model/shoppable-video-data';
import { EditorCommandsService } from '../services/editor-commands.service';
import {
  AddKeyframeCommand,
  MoveKeyframePositionCommand,
} from '../services/editor-commands/keyframe-commands';
import { EditorService } from '../services/editor.service';
import { FieldService } from '../services/field.service';
import { ScreenService } from '../services/screen.service';
import { VideoService } from '../services/video.service';

interface TransformedHotspot {
  visible: boolean;
  transform: string;
}

@Component({
  selector: 'app-player-canvas',
  templateUrl: './player-canvas.component.html',
  styleUrls: ['./player-canvas.component.scss'],
})
export class PlayerCanvasComponent implements OnInit {
  hotspotTransforms: TransformedHotspot[] = [];
  videoWidth!: number;
  videoHeight!: number;

  private dragIndex = -1;
  private relativeDrag: Point = { x: 0, y: 0 };
  private oldPosition: Point | undefined;

  @ViewChild('container', { static: false })
  containerElem!: ElementRef<HTMLDivElement>;

  constructor(
    public field: FieldService,
    public video: VideoService,
    public screen: ScreenService,
    private editor: EditorService,
    private commands: EditorCommandsService
  ) {
    field.fieldUpdated.subscribe((data) => {
      this.updateTransforms(data);
    });

    video.videoProgress.subscribe((time) => {
      this.updateTransforms(field.data);
    });

    screen.sizeUpdated.subscribe((_) => {
      this.updateVideoSize();
      this.updateTransforms(field.data);
    });

    video.videoChanged.subscribe((video) => {
      this.updateVideoSize();
    });

    this.updateVideoSize();
    this.updateTransforms(field.data);
  }

  updateVideoSize() {
    const videoWidth = this.video.video?.videoWidth ?? 500;
    const videoHeight = this.video.video?.videoHeight ?? 500;

    const videoAspect = videoWidth / videoHeight;
    const canvasAspect = this.screen.width / 500;

    if (videoAspect > canvasAspect) {
      // Constrained by width.

      this.videoWidth = this.screen.width;
      this.videoHeight = this.videoWidth / videoAspect;
    } else {
      // Constrained by height.

      this.videoWidth = 500 * videoAspect;
      this.videoHeight = 500;
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

    if (previous.e) {
      return undefined;
    } else {
      return previous.p;
    }
  }

  getTransform(hotspot: ShoppableVideoHotspot): TransformedHotspot {
    const point = this.getHotspotPoint(hotspot);

    if (point === undefined) {
      return { visible: false, transform: '' };
    } else {
      return { visible: true, transform: this.transformFromPoint(point) };
    }
  }

  updateTransforms(data: ShoppableVideoData) {
    this.hotspotTransforms = data.hotspots.map((hotspot) =>
      this.getTransform(hotspot)
    );
  }

  ngOnInit(): void {}

  pointNearMouse(mousePos: Point, point: Point): boolean {
    const aspect = this.videoWidth / this.videoHeight;

    const diffX = (mousePos.x - point.x) * aspect;
    const diffY = mousePos.y - point.y;

    const distanceSquared = diffX * diffX + diffY * diffY;
    const pointDistance = 32 / this.videoHeight;

    return distanceSquared < pointDistance * pointDistance;
  }

  pointerDown(event: PointerEvent) {
    // If there's no active selected hotspot, do nothing. (?)
    if (this.editor.selectedHotspot === undefined) {
      return;
    }

    const hotspot = this.editor.selectedHotspot;
    const mousePos = this.getMouse(event);

    const point = this.getHotspotPoint(hotspot);

    // If the hotspot is invisible at the current point, or the mouse is clicked nearby, begin dragging.
    if (point === undefined || this.pointNearMouse(mousePos, point)) {
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

      if (!exact) {
        // Place a new timepoint with the interpolated position or mouse position.
        const newPoint: ShoppableVideoTimePoint = {
          t: this.video.currentTime,
          p: point || mousePos,
        };

        if (timepoint == hotspot.timeline.points.length - 1) {
          newPoint.e = true;
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
        y: Math.max(0, Math.min(1, mousePos.y + this.relativeDrag.y))
      }

      this.updateTransforms(this.field.data);
    }
  }

  pointerMove(pointer: PointerEvent) {
    if (this.dragIndex !== -1) {
      this.modeDraggedKeypoint(pointer);
    }
  }

  pointerUp(pointer: PointerEvent) {
    const hotspot = this.editor.selectedHotspot;
    if (this.dragIndex !== -1 && hotspot) {
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
    }

    this.dragIndex = -1;
  }
}
