import { ShoppableVideoData } from "src/app/field/model/shoppable-video-data";

export enum EditorCommandType {
  AddHotspot,
  RemoveHotspot,
  SetHotspotInfo,

  AddKeyframe,
  RemoveKeyframe,
  MoveKeyframe,
  MoveKeyframePosition,
  MoveKeyframeCta,
  ToggleKeyframeEnd
}

export interface EditorCommand {
  type: EditorCommandType;

  apply: (data: ShoppableVideoData) => boolean;
  revert: (data: ShoppableVideoData) => boolean;
}
