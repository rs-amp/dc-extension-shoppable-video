import { Component, HostBinding } from '@angular/core';
import { EditorMode, EditorService } from './services/editor.service';
import { VideoErrorType, VideoService } from './services/video.service';
import { VisualizationSdkService } from './services/visualization-sdk.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Shoppabble Video';

  get active(): boolean {
    return this.editor.editorMode == EditorMode.Edit && this.video.videoReady && !this.videoError;
  }

  get disableEditor(): boolean {
    return this.editor.editorMode == EditorMode.Edit && (!this.video.videoReady || this.videoError);
  }

  get videoError(): boolean {
    return this.video.videoError !== VideoErrorType.None;
  }

  constructor(private editor: EditorService, public vis: VisualizationSdkService, private video: VideoService) {
  }
}
