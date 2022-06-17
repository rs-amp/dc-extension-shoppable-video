import { ShoppableVideoCallToAction, ShoppableVideoData, ShoppableVideoHotspot } from "src/app/field/model/shoppable-video-data";
import { EditorCommand, EditorCommandType } from "./editor-command";

const newHotspot: ShoppableVideoHotspot = {
  target: 'example',
  selector: '.example',
  timeline: {
    points: [],
  },
  cta: {} as ShoppableVideoCallToAction // Force the create dialog to have CTA enabled.
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
  oldCallToAction?: ShoppableVideoCallToAction;

  cancelled = false;
  deleted = false;
  isNew = false;

  constructor(private hotspot: ShoppableVideoHotspot, public selector: string, public target: string, public cta?: ShoppableVideoCallToAction) {

  }

  apply(data: ShoppableVideoData): boolean {
    this.oldTarget = this.hotspot.target;
    this.oldSelector = this.hotspot.selector;
    this.oldCallToAction = this.hotspot.cta;

    this.hotspot.target = this.target;
    this.hotspot.selector = this.selector;
    this.hotspot.cta = this.cta;

    return true;
  }

  revert(data: ShoppableVideoData): boolean {
    this.hotspot.target = this.oldTarget as string;
    this.hotspot.selector = this.oldSelector as string;
    this.hotspot.cta = this.oldCallToAction;

    return true;
  }
}
