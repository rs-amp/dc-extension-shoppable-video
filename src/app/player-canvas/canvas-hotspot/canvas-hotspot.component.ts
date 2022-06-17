import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-canvas-hotspot',
  templateUrl: './canvas-hotspot.component.html',
  styleUrls: ['./canvas-hotspot.component.scss']
})
export class CanvasHotspotComponent implements OnInit {

  @Input('selected') selected?: boolean;
  @Input('ghost') ghost?: boolean;

  constructor() { }

  ngOnInit(): void {
  }

}
