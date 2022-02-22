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

export interface ShoppableVideoHotspot {
  target: string;
  selector: string;
  timeline: ShoppableVideoTimeline;
}

export interface ShoppableVideoData {
  video: MediaVideoLink;
  hotspots: ShoppableVideoHotspot[];
}
