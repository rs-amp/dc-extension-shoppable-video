import { Component, OnInit } from '@angular/core';
import { EditorCommandsService } from '../services/editor-commands.service';
import { EditorMode, EditorService } from '../services/editor.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {

  constructor(private editor: EditorService, public commands: EditorCommandsService) { }

  ngOnInit(): void {
  }

  swap() {
    this.editor.modeRequest(EditorMode.View);
  }

  undo() {
    this.commands.undo();
  }

  redo() {
    this.commands.redo();
  }
}
