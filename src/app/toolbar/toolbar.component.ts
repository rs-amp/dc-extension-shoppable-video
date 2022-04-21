import { Component, OnInit } from '@angular/core';
import { EditorCommandsService } from '../services/editor-commands.service';
import { EditorMode, EditorService } from '../services/editor.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {

  get themeIcon(): string {
    return this.theme.activeTheme === 'light' ? 'wb_sunny' : 'wb_sunny' ;
  }

  constructor(private editor: EditorService, public commands: EditorCommandsService, private theme: ThemeService) { }

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

  toggleDarkMode() {
    if (this.theme.activeTheme === 'light') {
      this.theme.setTheme('dark');
    } else {
      this.theme.setTheme('light');
    }
  }
}
