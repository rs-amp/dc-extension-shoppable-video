import { Component, Inject, Input, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SetHotspotInfoCommand } from 'src/app/services/editor-commands/hotspot-commands';

@Component({
  selector: 'app-hotspot-edit-dialog',
  templateUrl: './hotspot-edit-dialog.component.html',
  styleUrls: ['./hotspot-edit-dialog.component.scss']
})
export class HotspotEditDialogComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<HotspotEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public hotspot: SetHotspotInfoCommand) { }

  ngOnInit(): void {

  }

  onCancel(): void {
    this.hotspot.cancelled = true;
    this.dialogRef.close();
  }

}
