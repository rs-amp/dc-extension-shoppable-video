import { Component, OnInit } from '@angular/core';
import { EditorCommandsService } from '../services/editor-commands.service';
import { EditorMode, EditorService } from '../services/editor.service';
import { FieldService } from '../services/field.service';
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

  get isEditor(): boolean {
    return this.field.isEditor;
  }

  get hasMultipleVideos(): boolean {
    return this.field.hasMultipleVideos;
  }

  get topButtonsSize(): string {
    let buttonCount = 1;
    if (this.isEditor) {
      buttonCount += this.hasMultipleVideos ? 2 : 1;
    } else {
      buttonCount += 1;
    }

    return (buttonCount * 34) + 'px';
  }

  constructor(private editor: EditorService, public commands: EditorCommandsService, private theme: ThemeService, private field: FieldService) { }

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

  toggleFullscreen() {
    document.body.requestFullscreen();
  }

  swapVideo() {
    this.editor.modeRequest(EditorMode.Swap);
  }

  swapField() {
    this.editor.changeVideo();
  }
}
