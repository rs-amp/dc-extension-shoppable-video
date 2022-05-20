# Content Hub Setup

The Shoppable Video Extension requires that your video is both published, transcoded and has full video metadata included. 

## Transcoding

You need a transcoding profile for your videos to be editable, and be used in your render after editing. The shoppable video extension will select the transcoding with the highest bitrate to display in the editor.

See [this page](https://amplience.com/docs/contenthub/videotranscodeprofiles.html) for more information on how to manage your transcoding profiles.

## Video Metadata

The extension uses the framerate field in the video metadata to drive frame advance controls and operations that round to the nearest frame. You'll need to make sure that this is published with the video so that the editor can access and use it.

Contact Amplience Support for help with adding this metadata schema to videos on your account.
