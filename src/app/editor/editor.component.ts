import { Component, OnInit } from '@angular/core';
import { EditorCommandsService } from '../services/editor-commands.service';
import { AddHotspotCommand } from '../services/editor-commands/hotspot-commands';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {

  constructor(private commands: EditorCommandsService) { }

  ngOnInit(): void {
  }

}
