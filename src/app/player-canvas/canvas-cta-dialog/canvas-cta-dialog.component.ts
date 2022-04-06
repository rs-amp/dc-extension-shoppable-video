import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

interface DialogData {
  value: string;
}

@Component({
  selector: 'app-canvas-cta-dialog',
  templateUrl: './canvas-cta-dialog.component.html',
  styleUrls: ['./canvas-cta-dialog.component.scss']
})
export class CanvasCtaDialogComponent implements OnInit {

  value: string;

  constructor(@Inject(MAT_DIALOG_DATA) data: DialogData) {
    this.value = data.value;
  }

  ngOnInit(): void {
  }

}
