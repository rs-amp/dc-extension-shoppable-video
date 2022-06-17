import { Component, OnInit } from '@angular/core';
import { EditorMode, EditorService } from '../services/editor.service';
import { FieldService } from '../services/field.service';
import { VideoErrorType, VideoService } from '../services/video.service';

@Component({
  selector: 'app-error-display',
  templateUrl: './error-display.component.html',
  styleUrls: ['./error-display.component.scss']
})
export class ErrorDisplayComponent implements OnInit {
  VideoErrorType = VideoErrorType;

  get loading(): boolean {
    return !this.video.videoReady;
  }

  get type(): VideoErrorType {
    return this.video.videoError;
  }

  constructor(private editor: EditorService, private video: VideoService, private field: FieldService) { }

  ngOnInit(): void {
  }

  swap(): void {
    this.editor.modeRequest(EditorMode.Swap);
  }

  retry(): void {
    this.video.loadImage(this.field.data);
  }

}
