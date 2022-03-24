import {
  Point,
  ShoppableVideoData,
  ShoppableVideoHotspot,
  ShoppableVideoTimePoint,
} from 'src/app/field/model/shoppable-video-data';
import { EditorCommand, EditorCommandType } from './editor-command';

// Some notes about keyframe addition and CTAs.

// If a keyframe with a CTA is removed, its CTA moves to the next visible keyframe in the timeline.
// If a keyframe is placed before another visible keyframe, but either after an invisible one or the start,
// then it should inherit the cta position from the other keyframe.

const hasCta = (point: Point | undefined): boolean => {
  return point != null && point.x != null;
}

export class MoveKeyframeCommand implements EditorCommand {
  type = EditorCommandType.MoveKeyframe;

  constructor(
    private hotspot: ShoppableVideoHotspot,
    private index: number,
    private oldT: number,
    private newT: number
  ) {}

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
  private tookCta = false;

  constructor(
    private hotspot: ShoppableVideoHotspot,
    private timepoint: ShoppableVideoTimePoint,
    private index: number
  ) {}

  apply(data: ShoppableVideoData): boolean {
    const points = this.hotspot.timeline.points;
    points.splice(this.index, 0, this.timepoint);

    if (this.index != 0) {
      const prevPoint = points[this.index - 1];

      if (prevPoint.e) {
        delete prevPoint.e; // Extend the previous point to this one.
        this.didEnd = true;
      }
    }

    if (this.index != points.length - 1) {
      const nextPoint = points[this.index + 1];

      if (nextPoint.cta && nextPoint.cta.x != null) {
        this.tookCta = true;

        this.timepoint.cta = nextPoint.cta;
        nextPoint.cta = undefined;
      }
    }

    return true;
  }

  revert(data: ShoppableVideoData): boolean {
    const points = this.hotspot.timeline.points;
    points.splice(this.index, 1);

    if (this.index != 0 && this.didEnd) {
      const prevPoint = this.hotspot.timeline.points[this.index - 1];

      prevPoint.e = true;
    }

    if (this.index != points.length - 1 && this.tookCta) {
      const nextPoint = points[this.index + 1];

      nextPoint.cta = this.timepoint.cta;
    }

    return true;
  }
}

export class RemoveKeyframeCommand implements EditorCommand {
  type = EditorCommandType.RemoveKeyframe;
  oldTimepoint?: ShoppableVideoTimePoint;
  private propagateEnd = false;
  private movedCta = false;
  private oldCta?: Point;

  constructor(private hotspot: ShoppableVideoHotspot, private index: number) {}

  apply(data: ShoppableVideoData): boolean {
    const points = this.hotspot.timeline.points;
    this.oldTimepoint = points[this.index];
    points.splice(this.index, 1);

    if (this.index > 0) {
      const prevPoint = points[this.index - 1];
      if (this.oldTimepoint.e && !prevPoint.e) {
        prevPoint.e = true;
        this.propagateEnd = true;
      }

      if (this.oldTimepoint.cta && !prevPoint.e) {
        prevPoint.cta = this.oldTimepoint.cta;
        this.movedCta = true;
      }
    }

    if (this.oldTimepoint.cta && !this.oldTimepoint.e && this.index < points.length - 1) {
      const nextPoint = points[this.index];
      this.oldCta = nextPoint.cta;
      nextPoint.cta = this.oldTimepoint.cta;
      this.movedCta = true;
    }

    return true;
  }

  revert(data: ShoppableVideoData): boolean {
    if (this.movedCta) {
      this.hotspot.timeline.points[this.index].cta = this.oldCta;
    }

    this.hotspot.timeline.points.splice(
      this.index,
      0,
      this.oldTimepoint as ShoppableVideoTimePoint
    );

    if (this.propagateEnd) {
      this.hotspot.timeline.points[this.index - 1].e = false;
    }

    return true;
  }
}

export class MoveKeyframePositionCommand implements EditorCommand {
  type = EditorCommandType.MoveKeyframePosition;

  constructor(
    private hotspot: ShoppableVideoHotspot,
    private index: number,
    private oldPosition: Point,
    private position: Point
  ) {}

  apply(data: ShoppableVideoData): boolean {
    this.hotspot.timeline.points[this.index].p = this.position;

    return true;
  }

  revert(data: ShoppableVideoData): boolean {
    this.hotspot.timeline.points[this.index].p = this.oldPosition;

    return true;
  }
}

export class MoveKeyframeCtaCommand implements EditorCommand {
  type = EditorCommandType.MoveKeyframeCta;

  constructor(
    private hotspot: ShoppableVideoHotspot,
    private index: number,
    private oldPosition: Point | undefined,
    private position: Point | undefined
  ) {}

  apply(data: ShoppableVideoData): boolean {
    this.hotspot.timeline.points[this.index].cta = this.position;

    return true;
  }

  revert(data: ShoppableVideoData): boolean {
    this.hotspot.timeline.points[this.index].cta = this.oldPosition;

    return true;
  }
}

export class ToggleKeyframeEndCommand implements EditorCommand {
  type = EditorCommandType.ToggleKeyframeEnd;

  private toggledCta = false;
  private toggledCtaPos?: Point;

  constructor(private hotspot: ShoppableVideoHotspot, private index: number) {}

  apply(data: ShoppableVideoData, isRevert = false): boolean {
    const points = this.hotspot.timeline.points;
    const point = points[this.index];

    if (point.e) {
      delete point.e;

      // If the point after this one has a cta, its cta has now been merged with whatever is before us.
      if (this.index != points.length - 1) {
        const nextPoint = points[this.index + 1];
        if (hasCta(nextPoint.cta)) {
          if (!isRevert) {
            this.toggledCta = true;
            this.toggledCtaPos = nextPoint.cta;
          }
          nextPoint.cta = undefined;
        }
      }
    } else {
      point.e = true;

      // The point after this should gain a cta, as there's now a gap.
      if (this.index != points.length - 1) {
        const nextPoint = points[this.index + 1];
        if (this.toggledCta) {
          nextPoint.cta = this.toggledCtaPos;
        } else {
          nextPoint.cta = { x: 0.5, y: 0.5 };
        }
      }
    }

    return true;
  }

  revert(data: ShoppableVideoData): boolean {
    return this.apply(data, true);
  }
}
