import { Component, HostBinding, OnInit } from '@angular/core';
import { MediaImageLink } from 'dc-extensions-sdk/dist/types/lib/components/MediaLink';
import { EditorMode, EditorService } from '../services/editor.service';
import { FieldService } from '../services/field.service';

@Component({
  selector: 'app-mode-buttons',
  templateUrl: './mode-buttons.component.html',
  styleUrls: ['./mode-buttons.component.scss']
})
export class ModeButtonsComponent implements OnInit {

  hasVideo = false;
  @HostBinding('class.amp-mode-buttons__hide') hidden!: boolean;
  get showButtons(): boolean {
    return this.editor.editorMode === EditorMode.View;
  }

  constructor(private field: FieldService, private editor: EditorService) {
    this.updateData();
    field.fieldUpdated.subscribe(data => {
      this.updateData();
    });
    editor.modeChange.subscribe(mode => {
      this.hidden = !this.showButtons;
    });
  }

  ngOnInit(): void {
  }

  updateData() {
    const data = this.field.data;
    this.hasVideo = data != null && data.video != null && !(data.video as any)._empty;
  }

  changeMode(mode: string) {
    this.editor.modeRequest(mode as EditorMode);
  }
}
