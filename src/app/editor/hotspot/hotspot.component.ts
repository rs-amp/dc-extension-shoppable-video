import { Component, Input, OnInit } from '@angular/core';
import { ShoppableVideoHotspot, ShoppableVideoTimePoint } from 'src/app/field/model/shoppable-video-data';
import { EditorCommandsService } from 'src/app/services/editor-commands.service';
import { RemoveHotspotCommand } from 'src/app/services/editor-commands/hotspot-commands';
import { AddKeyframeCommand, RemoveKeyframeCommand } from 'src/app/services/editor-commands/keyframe-commands';
import { EditorService } from 'src/app/services/editor.service';
import { VideoService } from 'src/app/services/video.service';

@Component({
  selector: 'app-hotspot',
  templateUrl: './hotspot.component.html',
  styleUrls: ['./hotspot.component.scss']
})
export class HotspotComponent implements OnInit {

  @Input('hotspot') hotspot!: ShoppableVideoHotspot;

  constructor(private commands: EditorCommandsService, private editor: EditorService, private video: VideoService) { }

  ngOnInit(): void {
  }

  addKeyframe(): void {
    let { timepoint, exact } = this.getKeyframeNearestNow();

    if (!exact) {
      let currentPoint = this.editor.getHotspotPoint(this.hotspot);

      if (currentPoint == null) {
        currentPoint = { x: 0.5, y: 0.5 };
      }

      const newPoint: ShoppableVideoTimePoint = {
        t: this.video.currentTime,
        p: currentPoint
      }

      if (timepoint == this.hotspot.timeline.points.length - 1) {
        newPoint.e = true;
      }

      this.commands.runCommand(new AddKeyframeCommand(this.hotspot, newPoint, ++timepoint));
      this.editor.select(this.hotspot, timepoint);
    }
  }

  removeKeyframe(): void {
    let { timepoint, exact } = this.getKeyframeNearestNow();

    if (exact) {
      this.commands.runCommand(new RemoveKeyframeCommand(this.hotspot, timepoint));
    }
  }

  editHotspot(): void {
    this.editor.openHotspotDialog(this.hotspot);
  }

  removeHotspot(): void {
    this.commands.runCommand(new RemoveHotspotCommand(this.hotspot));
  }

  getKeyframeNearestNow(): { timepoint: number, exact: boolean } {
    return this.editor.findNearestTimepoint(this.hotspot, this.video.currentTime);
  }

  canAdd(): boolean {
    return !this.canRemove();
  }

  canRemove(): boolean {
    // A keyframe exists at roughtly this timestamp.
    const { timepoint, exact } = this.getKeyframeNearestNow();

    return timepoint !== -1 && exact;
  }

}
