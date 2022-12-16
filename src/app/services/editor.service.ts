import { EventEmitter, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MediaImageLink, MediaVideoLink } from 'dc-extensions-sdk/dist/types/lib/components/MediaLink';
import { HotspotEditDialogComponent } from '../editor/hotspot-edit-dialog/hotspot-edit-dialog.component';
import { ExtensionSdkService } from '../field/extension-sdk.service';
import {
  Point,
  ShoppableVideoCallToAction,
  ShoppableVideoHotspot,
  ShoppableVideoTimePoint,
} from '../field/model/shoppable-video-data';
import { EditorCommandsService } from './editor-commands.service';
import { RemoveHotspotCommand, SetHotspotInfoCommand } from './editor-commands/hotspot-commands';
import {
  AddKeyframeCommand,
  RemoveKeyframeCommand,
} from './editor-commands/keyframe-commands';
import { FieldService } from './field.service';
import { KeyboardService } from './keyboard.service';
import { VideoService } from './video.service';

export enum EditorMode {
  View = 'view',
  Edit = 'edit',

  // These aren't real modes, they just trigger actions.
  Swap = 'swap',
  Delete = 'delete',
}

@Injectable({
  providedIn: 'root',
})
export class EditorService {
  editorMode: EditorMode = EditorMode.View;
  modeChange: EventEmitter<EditorMode> = new EventEmitter();
  selectionChanged: EventEmitter<ShoppableVideoHotspot | undefined> =
    new EventEmitter();

  selectedHotspot: ShoppableVideoHotspot | undefined;
  selectedTimepoint = -1;
  dialogOpen = false;
  forcedFullscreen = false;
  fullscreen = false;

  constructor(
    private field: FieldService,
    private sdkService: ExtensionSdkService,
    private video: VideoService,
    private commands: EditorCommandsService,
    private dialog: MatDialog,
    private keyboard: KeyboardService
  ) {
    video.videoProgress.subscribe(() => {
      this.checkSelectedTimepoint();
    });

    commands.commandRun.subscribe(() => {
      this.validateSelection();
    });

    field.fieldUpdated.subscribe(() => {
      if (field.isEditor) {
        this.forcedFullscreen = true;
        if (!this.fullscreen) {
          this.fullscreen = true;
        }
      }
    });

    field.editorUpdated.subscribe((data) => {
      if ((data.video as MediaImageLink).name == null) {
        this.modeRequest(EditorMode.Swap);
      } else {
        this.modeRequest(EditorMode.Edit);
      }
    });

    keyboard.lastKeyframeFunc = this.seekLastKeyframe.bind(this);
    keyboard.nextKeyframeFunc = this.seekNextKeyframe.bind(this);
    keyboard.deleteKeyframeFunc = this.deleteActiveKeyframe.bind(this);
    keyboard.insertKeyframeFunc = this.insertKeyframe.bind(this);
  }

  async modeRequest(mode: EditorMode) {
    switch (mode) {
      case EditorMode.View:
        this.editorMode = EditorMode.View;
        break;
      case EditorMode.Swap:
        this.switchVideo();
        break;
      case EditorMode.Edit:
        this.editorMode = EditorMode.Edit;
        break;
      case EditorMode.Delete:
        await this.field.resetDefault();
        (this.field.data as any).video = null;
        this.editorMode = EditorMode.View;
        this.field.updateField();
        break;
    }

    this.modeChange.emit(this.editorMode);
  }

  async switchVideo() {
    const sdk = await this.sdkService.getSDK();
    let result: MediaVideoLink;
    try {
      result = await sdk.mediaLink.getVideo();
    } catch (err) {
      // decided against switching the video.
      return;
    }
    await this.field.resetDefault();
    this.field.data.video = result;
    await this.field.updateField();
    this.video.loadImage(this.field.data);
    this.video.parseDataChange(this.field.data);
    await this.field.updateField();
    this.modeRequest(EditorMode.Edit);
  }

  select(hotspot: ShoppableVideoHotspot, index = -1) {
    if (this.field.data.hotspots.indexOf(hotspot) === -1) {
      return;
    }

    this.selectedHotspot = hotspot;
    this.selectedTimepoint = index;

    this.selectionChanged.emit(this.selectedHotspot);
  }

  validateSelection() {
    // Make sure the selected hotspot/timepoint still exists.
    if (this.selectedHotspot) {
      const index = this.field.data.hotspots.indexOf(this.selectedHotspot);
      if (index === -1) {
        this.selectedHotspot = undefined;
        this.selectedTimepoint = -1;
        this.selectionChanged.emit(this.selectedHotspot);
      } else if (this.selectedTimepoint !== -1) {
        this.checkSelectedTimepoint();
      }
    }
  }

  checkSelectedTimepoint() {
    let selectedTimepoint = -1;

    if (this.selectedHotspot != null) {
      let pointIndex = 0;
      for (const point of this.selectedHotspot.timeline.points) {
        if (this.video.quantizeEqual(point.t, this.video.currentTime)) {
          selectedTimepoint = pointIndex;
        }
        pointIndex++;
      }
    }

    this.selectedTimepoint = selectedTimepoint;
  }

  findNearestTimepoint(
    hotspot: ShoppableVideoHotspot,
    time: number
  ): { timepoint: number; exact: boolean } {
    const timeline = hotspot.timeline.points;

    if (timeline.length == 0) {
      return { timepoint: -1, exact: false };
    }

    for (let i = timeline.length - 1; i >= 0; i--) {
      const point = timeline[i];

      if (this.video.quantizeEqual(point.t, time)) {
        return { timepoint: i, exact: true };
      }

      if (time > point.t) {
        return { timepoint: i, exact: false };
      }
    }

    return { timepoint: -1, exact: false };
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

  seekLastKeyframe(): void {
    if (this.selectedHotspot != null) {
      // Find the last timepoint with t < the current time, and skip to it.
      const hotspot = this.selectedHotspot;
      const timeline = hotspot.timeline.points;
      const time = this.video.currentTime;

      for (let i = timeline.length - 1; i >= 0; i--) {
        const point = timeline[i];

        if (time > point.t && !this.video.quantizeEqual(point.t, time)) {
          this.video.setCurrentTime(point.t);
          return;
        }
      }

      this.video.setCurrentTime(0);
    }
  }

  seekNextKeyframe() {
    if (this.selectedHotspot != null) {
      // Find the first timepoint with t > the current time, and skip to it.
      const hotspot = this.selectedHotspot;
      const timeline = hotspot.timeline.points;
      const time = this.video.currentTime;

      for (let i = 0; i < timeline.length; i++) {
        const point = timeline[i];

        if (time < point.t && !this.video.quantizeEqual(point.t, time)) {
          this.video.setCurrentTime(point.t);
          return;
        }
      }

      this.video.setCurrentTime(this.video.duration);
    }
  }

  deleteActiveKeyframe() {
    if (this.selectedHotspot != null) {
      let { timepoint, exact } = this.findNearestTimepoint(
        this.selectedHotspot,
        this.video.currentTime
      );

      if (exact) {
        this.commands.runCommand(
          new RemoveKeyframeCommand(this.selectedHotspot, timepoint)
        );
      }
    }
  }

  insertKeyframe() {
    if (this.selectedHotspot != null) {
      const hotspot = this.selectedHotspot;

      let { timepoint, exact } = this.findNearestTimepoint(
        hotspot,
        this.video.currentTime
      );

      if (!exact) {
        let currentPoint = this.getHotspotPoint(hotspot);

        if (currentPoint == null) {
          currentPoint = { x: 0.5, y: 0.5 };
        }

        const newPoint: ShoppableVideoTimePoint = {
          t: this.video.currentTime,
          p: currentPoint,
        };

        if (timepoint == hotspot.timeline.points.length - 1) {
          newPoint.e = true;
        }

        this.commands.runCommand(
          new AddKeyframeCommand(hotspot, newPoint, ++timepoint)
        );
        this.select(hotspot, timepoint);
      }
    }
  }

  openHotspotDialog(hotspot: ShoppableVideoHotspot, callback?: (cancelled: boolean) => void) {
    const cmd = new SetHotspotInfoCommand(
      hotspot,
      hotspot.selector,
      hotspot.target,
      hotspot.cta != null
        ? ({ ...hotspot.cta } as ShoppableVideoCallToAction)
        : undefined
    );
    cmd.isNew = callback != null;
    const dialogRef = this.dialog.open(HotspotEditDialogComponent, {
      width: '1000px',
      data: cmd,
    });
    this.dialogOpen = true;
    this.keyboard.ignoreShortcuts = true;

    dialogRef.afterClosed().subscribe((result) => {
      this.dialogOpen = false;
      this.keyboard.ignoreShortcuts = false;
      if (!cmd.cancelled) {
        this.commands.runCommand(cmd);
      }

      if (cmd.deleted) {
        const deleteCmd = new RemoveHotspotCommand(hotspot);
        this.commands.runCommand(deleteCmd);
      }

      if (callback) {
        callback(cmd.cancelled);
      }
    });
  }

  changeVideo() {
    this.sdkService.changeVideo();
  }
}
