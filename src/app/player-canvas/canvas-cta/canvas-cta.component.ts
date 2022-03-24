import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { ShoppableVideoCallToAction } from 'src/app/field/model/shoppable-video-data';

@Component({
  selector: 'app-canvas-cta',
  templateUrl: './canvas-cta.component.html',
  styleUrls: ['./canvas-cta.component.scss']
})
export class CanvasCtaComponent implements OnInit {

  @Input() cta!: ShoppableVideoCallToAction;

  constructor(public ref: ElementRef) { }

  ngOnInit(): void {
  }

}
