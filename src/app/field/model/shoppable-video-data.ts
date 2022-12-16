import { MediaVideoLink } from "dc-extensions-sdk/dist/types/lib/components/MediaLink";

export interface Point {
  x: number;
  y: number;
}

export interface ShoppableVideoTimePoint {
  /**
   * The time (in seconds) of this timepoint.
   */
  t: number;

  /**
   * The position of the hotspot on this timepoint.
   */
  p: Point;

  /**
   * Changes the position of the cta when present.
   */
  cta?: Point;

  /**
   * When true, the hotspot will become invisible after this timepoint. (until the end or another timepoint)
   */
  e?: boolean;
}

export interface ShoppableVideoTimeline {
  /**
   * A sorted array of timepoints.
   */
  points: ShoppableVideoTimePoint[];
}

export interface ShoppableVideoCallToAction {
  /**
   * String caption for the call-to-action.
   * Behaviour within the editor is for the caption to appear as a button centered on the CTA position.
   */
  caption: string;

  /**
   * CTA value. Example: URL for when CTA is clicked.
   */
  value: string;
}

export interface ShoppableVideoHotspot {
  target: string;
  selector: string;
  timeline: ShoppableVideoTimeline;
  cta?: ShoppableVideoCallToAction;

  data?: any;
}

export interface ShoppableVideoData {
  video: MediaVideoLink;
  hotspots: ShoppableVideoHotspot[];
}
