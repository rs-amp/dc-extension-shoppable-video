import { Component } from '@angular/core';
import { EditorMode, EditorService } from './services/editor.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Shoppabble Video';

  get active(): boolean {
    return this.editor.editorMode == EditorMode.Edit;
  }

  constructor(private editor: EditorService) {

  }
}
