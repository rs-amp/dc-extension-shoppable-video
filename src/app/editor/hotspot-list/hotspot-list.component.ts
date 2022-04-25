import { Component, OnInit } from '@angular/core';
import { ShoppableVideoHotspot } from 'src/app/field/model/shoppable-video-data';
import { EditorCommandsService } from 'src/app/services/editor-commands.service';
import { AddHotspotCommand, RemoveHotspotCommand } from 'src/app/services/editor-commands/hotspot-commands';
import { EditorService } from 'src/app/services/editor.service';
import { FieldService } from 'src/app/services/field.service';

@Component({
  selector: 'app-hotspot-list',
  templateUrl: './hotspot-list.component.html',
  styleUrls: ['./hotspot-list.component.scss']
})
export class HotspotListComponent implements OnInit {

  constructor(public field: FieldService, private editor: EditorService, private commands: EditorCommandsService) { }

  ngOnInit(): void {
  }

  addHotspot(event: MouseEvent): boolean {
    const cmd = new AddHotspotCommand();
    this.commands.runCommand(cmd);

    this.editor.openHotspotDialog(cmd.addedHotspot as ShoppableVideoHotspot, (cancelled: boolean) => {
      if (cancelled) {
        const cmd2 = new RemoveHotspotCommand(cmd.addedHotspot as ShoppableVideoHotspot);
        this.commands.runCommand(cmd2);
      }
    });
    this.editor.select(cmd.addedHotspot as ShoppableVideoHotspot);

    event.preventDefault();
    return false;
  }

  select(hotspot: ShoppableVideoHotspot): void {
    this.editor.select(hotspot);
  }

  selected(hotspot: ShoppableVideoHotspot): boolean {
    return this.editor.selectedHotspot === hotspot;
  }

  trackHotspot(index: number, hotspot: ShoppableVideoHotspot): number {
    return index;
  }

}
