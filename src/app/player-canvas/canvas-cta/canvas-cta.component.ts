import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ShoppableVideoCallToAction, ShoppableVideoHotspot } from 'src/app/field/model/shoppable-video-data';
import { CanvasCtaDialogComponent } from '../canvas-cta-dialog/canvas-cta-dialog.component';

@Component({
  selector: 'app-canvas-cta',
  templateUrl: './canvas-cta.component.html',
  styleUrls: ['./canvas-cta.component.scss']
})
export class CanvasCtaComponent implements OnInit {

  @Input() cta!: ShoppableVideoCallToAction;
  @Input() hotspot!: ShoppableVideoHotspot;
  @Input('vis') vis?: boolean;

  get buttonColor() {
    return this.hotspot?.data?.color ?? 'white';
  }

  constructor(public ref: ElementRef, private dialog: MatDialog) { }

  ngOnInit(): void {
  }

  ctaClick() {
    if (!this.vis) {
      return;
    }

    let url: URL;

    try {
      url = new URL(this.cta.value);
    } catch (_) {
      // Show dialog for non-url CTA.
      this.dialog.open(CanvasCtaDialogComponent, { data: { value: this.cta.value } });
      return;
    }

    if (!(url.protocol === 'http:' || url.protocol === 'https:')) {
      // Show dialog for non-url CTA.
      this.dialog.open(CanvasCtaDialogComponent, { data: { value: this.cta.value } });
      return;
    }

    window.open(this.cta.value, '_blank');
  }
}
