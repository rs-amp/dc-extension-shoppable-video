import { Component, HostListener, OnInit } from '@angular/core';
import { EditorCommandsService } from '../services/editor-commands.service';
import { AddHotspotCommand } from '../services/editor-commands/hotspot-commands';
import { KeyboardService } from '../services/keyboard.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {

  scrolled = false;

  constructor(private commands: EditorCommandsService, private keyboard: KeyboardService) { }

  ngOnInit(): void {
  }

  @HostListener('scroll', ['$event.target'])
  onScroll(element: HTMLElement) {
    this.scrolled = element.scrollTop != 0;
  }

}
