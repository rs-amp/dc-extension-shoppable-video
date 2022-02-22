import { Point, ShoppableVideoData, ShoppableVideoHotspot, ShoppableVideoTimePoint } from "src/app/field/model/shoppable-video-data";
import { EditorCommand, EditorCommandType } from "./editor-command";

export class MoveKeyframeCommand implements EditorCommand {
  type = EditorCommandType.MoveKeyframe;

  constructor(private hotspot: ShoppableVideoHotspot, private index: number, private oldT: number, private newT: number) {}

  apply(data: ShoppableVideoData): boolean {
    this.hotspot.timeline.points[this.index].t = this.newT;

    return true;
  }

  revert(data: ShoppableVideoData): boolean {
    this.hotspot.timeline.points[this.index].t = this.oldT;

    return true;
  }
}

export class AddKeyframeCommand implements EditorCommand {
  type = EditorCommandType.AddKeyframe;
  private didEnd = false;

  constructor(private hotspot: ShoppableVideoHotspot, private timepoint: ShoppableVideoTimePoint, private index: number) {}

  apply(data: ShoppableVideoData): boolean {
    this.hotspot.timeline.points.splice(this.index, 0, this.timepoint);

    if (this.index != 0) {
      const prevPoint = this.hotspot.timeline.points[this.index - 1];

      if (prevPoint.e) {
        delete prevPoint.e; // Extend the previous point to this one.
        this.didEnd = true;
      }
    }

    return true;
  }

  revert(data: ShoppableVideoData): boolean {
    this.hotspot.timeline.points.splice(this.index, 1);

    if (this.index != 0 && this.didEnd) {
      const prevPoint = this.hotspot.timeline.points[this.index - 1];

      prevPoint.e = true;
    }

    return true;
  }
}

export class RemoveKeyframeCommand implements EditorCommand {
  type = EditorCommandType.RemoveKeyframe;
  oldTimepoint?: ShoppableVideoTimePoint;
  private propagateEnd = false;

  constructor(private hotspot: ShoppableVideoHotspot, private index: number) {

  }

  apply(data: ShoppableVideoData): boolean {
    this.oldTimepoint = this.hotspot.timeline.points[this.index];
    this.hotspot.timeline.points.splice(this.index, 1);

    if (this.oldTimepoint.e && this.index > 0 && !this.hotspot.timeline.points[this.index - 1].e) {
      this.hotspot.timeline.points[this.index - 1].e = true;
      this.propagateEnd = true;
    }

    return true;
  }

  revert(data: ShoppableVideoData): boolean {
    this.hotspot.timeline.points.splice(this.index, 0, this.oldTimepoint as ShoppableVideoTimePoint);

    if (this.propagateEnd) {
      this.hotspot.timeline.points[this.index - 1].e = false;
    }

    return true;
  }
}

export class MoveKeyframePositionCommand implements EditorCommand {
  type = EditorCommandType.MoveKeyframePosition;

  constructor(private hotspot: ShoppableVideoHotspot, private index: number, private oldPosition: Point, private position: Point) {}

  apply(data: ShoppableVideoData): boolean {
    this.hotspot.timeline.points[this.index].p = this.position;

    return true;
  }

  revert(data: ShoppableVideoData): boolean {
    this.hotspot.timeline.points[this.index].p = this.oldPosition;

    return true;
  }
}

export class ToggleKeyframeEndCommand implements EditorCommand {
  type = EditorCommandType.ToggleKeyframeEnd;

  constructor(private hotspot: ShoppableVideoHotspot, private index: number) {}

  apply(data: ShoppableVideoData): boolean {
    const point = this.hotspot.timeline.points[this.index];

    if (point.e) {
      delete point.e;
    } else {
      point.e = true;
    }

    return true;
  }

  revert(data: ShoppableVideoData): boolean {
    return this.apply(data);
  }
}
