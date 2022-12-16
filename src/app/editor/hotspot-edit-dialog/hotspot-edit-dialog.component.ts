import { AfterViewInit, Component, ElementRef, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SetHotspotInfoCommand } from 'src/app/services/editor-commands/hotspot-commands';
import { ExtensionBridge } from 'dc-extensions-sdk-bridge';
import { ExtensionSdkService } from 'src/app/field/extension-sdk.service';
import { FieldService } from 'src/app/services/field.service';

@Component({
  selector: 'app-hotspot-edit-dialog',
  templateUrl: './hotspot-edit-dialog.component.html',
  styleUrls: ['./hotspot-edit-dialog.component.scss'],
})
export class HotspotEditDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('iframe') iframe!: ElementRef;
  private bridge!: ExtensionBridge;

  get useData() { return true; }

  get canSave(): boolean {
    return (
      this.hotspot.cta == null ||
      (this.hotspot.cta.caption != null &&
        this.hotspot.cta.caption.length > 0)
    );
  }

  constructor(
    private dialogRef: MatDialogRef<HotspotEditDialogComponent>,
    private sdk: ExtensionSdkService,
    private field: FieldService,
    @Inject(MAT_DIALOG_DATA) public hotspot: SetHotspotInfoCommand
  ) {}

  async ngAfterViewInit(): Promise<void> {
    const iframe = this.iframe.nativeElement;
    
    const index = this.field.data.hotspots.indexOf(this.hotspot.hotspot);

    this.bridge = new ExtensionBridge(
      this.field.isEditor ? `$.shoppableVideo.hotspots[${index}].data` : `$.hotspots[${index}].data`, 
      {
        parentConnection: (await this.sdk.getSDK()).connection,
        onChange: this.onChange.bind(this),
        field: this.hotspot.hotspot.data
      });

    await this.bridge.init(iframe);
    
    const data = this.field.schema?.properties?.hotspots?.items?.properties?.data;
    const src = data ? data['ui:extension']?.url : null;

    iframe.src = src ?? 'https://localhost:4500';
  }

  onChange(field: any) {
    const index = this.field.data.hotspots.indexOf(this.hotspot.hotspot);

    this.hotspot.hotspot.data = field;
    this.field.updateField();
  }

  ngOnInit(): void {}

  onCancel(): void {
    this.hotspot.cancelled = true;
    this.dialogRef.close();
  }

  onDelete(): void {
    this.hotspot.cancelled = true;
    this.hotspot.deleted = true;
    this.dialogRef.close();
  }

  ctaToggle(): void {
    if (this.hotspot.cta == null) {
      this.hotspot.cta = {
        caption: '',
        value: '',
      };
    } else {
      this.hotspot.cta = undefined;
    }
  }
}
