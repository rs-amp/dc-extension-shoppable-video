import { Component, HostBinding } from '@angular/core';
import { EditorMode, EditorService } from './services/editor.service';
import { ThemeService } from './services/theme.service';
import { VideoErrorType, VideoService } from './services/video.service';
import { VisualizationSdkService } from './services/visualization-sdk.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'Shoppabble Video';
  dark = true;

  @HostBinding('class') class = '';

  get active(): boolean {
    return (
      this.editor.editorMode == EditorMode.Edit &&
      this.video.videoReady &&
      !this.videoError
    );
  }

  get disableEditor(): boolean {
    return (
      this.editor.editorMode == EditorMode.Edit &&
      (!this.video.videoReady || this.videoError)
    );
  }

  get videoError(): boolean {
    return this.video.videoError !== VideoErrorType.None;
  }

  get themeName(): string {
    return `app-theme--${this.theme.activeTheme}`;
  }

  get fullscreen(): boolean {
    return this.editor.fullscreen;
  }

  constructor(
    private editor: EditorService,
    public vis: VisualizationSdkService,
    private video: VideoService,
    private theme: ThemeService
  ) {
    this.class = this.themeName;

    theme.changed.subscribe((name) => {
      this.class = this.themeName;
    });
  }
}
