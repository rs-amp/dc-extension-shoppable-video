import { ShoppableVideoData, ShoppableVideoHotspot } from "src/app/field/model/shoppable-video-data";
import { EditorCommand, EditorCommandType } from "./editor-command";

const newHotspot: ShoppableVideoHotspot = {
  target: 'example',
  selector: '.example',
  timeline: {
    points: [
      /*
      { t: 0, p: { x: 0.5, y: 0.5 }, cta: { x: 0.1, y: 0.1 } },
      { t: 2, p: { x: 0.6, y: 0.3 } },
      { t: 3, p: { x: 0.7, y: 0.7 }, e: true },

      { t: 6, p: { x: 0.1, y: 0.5 }, cta: { x: 0.5, y: 0.8 } },
      { t: 9, p: { x: 0.9, y: 0.5 }, e: true },
      */
    ],
  },
};

export class AddHotspotCommand implements EditorCommand {
  type = EditorCommandType.AddHotspot;
  addedHotspot?: ShoppableVideoHotspot;

  apply(data: ShoppableVideoData): boolean {
    if (this.addedHotspot == null) {
      this.addedHotspot = JSON.parse(JSON.stringify(newHotspot));
    }

    data.hotspots.push(this.addedHotspot as ShoppableVideoHotspot);

    return true;
  }

  revert(data: ShoppableVideoData): boolean {
    data.hotspots.splice(data.hotspots.indexOf(this.addedHotspot as ShoppableVideoHotspot));

    return true;
  }
}

export class RemoveHotspotCommand implements EditorCommand {
  type = EditorCommandType.RemoveHotspot;
  oldIndex?: number;

  constructor(private hotspot: ShoppableVideoHotspot) {

  }

  apply(data: ShoppableVideoData): boolean {
    this.oldIndex = data.hotspots.indexOf(this.hotspot);
    data.hotspots.splice(this.oldIndex, 1);

    return true;
  }

  revert(data: ShoppableVideoData): boolean {
    data.hotspots.splice(this.oldIndex as number, 0, this.hotspot);

    return true;
  }
}

export class SetHotspotInfoCommand implements EditorCommand {
  type = EditorCommandType.SetHotspotInfo;

  oldSelector?: string;
  oldTarget?: string;

  cancelled = false;

  constructor(private hotspot: ShoppableVideoHotspot, public selector: string, public target: string) {

  }

  apply(data: ShoppableVideoData): boolean {
    this.oldTarget = this.hotspot.target;
    this.oldSelector = this.hotspot.selector;

    this.hotspot.target = this.target;
    this.hotspot.selector = this.selector;

    return true;
  }

  revert(data: ShoppableVideoData): boolean {
    this.hotspot.target = this.oldTarget as string;
    this.hotspot.selector = this.oldSelector as string;

    return true;
  }
}
