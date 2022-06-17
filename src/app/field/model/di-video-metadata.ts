export interface DiVideoMedia {
  src: string;
  profile: string;
  profileLabel: string;
  protocol: string;
  updated: string;
  bitrate: string; // These are numbers, but in the JSON response they are encoded as strings.
  width: string;
  height: string;
  size: string;
  format: string;
  'video.codec': string;
  'audio.codec': string;
  'audio.channels': string;
  aspect: string | null;
}

export interface DiExtraVideoMetadata {
  'duration-in-ms': number,
  'file-size-in-bytes': number,
  format: string,
  'frame-rate': number,
  height: number,
  jobId: number,
  outputId: number,
  state: "finished",
  'total-bitrate-in-kbps': number,
  'video-bitrate-in-kbps': number,
  'video-codec': string,
  width: number,
}

export interface DiVideoDescMetadata {
  id: string,
  title: string
}

export interface DiVideoThumb {
  time: number;
  src: string;
}

export interface DiVideoMetadata {
  id: string;
  meta: {
    title: string;
    updated: string;
    duration: string;
    description: string | null;
    mainLink: string | null;
    mainThumb: {
      src: string;
    };
    metadata?: {
      video?: DiExtraVideoMetadata
      videoDesc?: DiVideoDescMetadata
    }
  };
  media: DiVideoMedia[];
  thumbs: DiVideoThumb[];
}
