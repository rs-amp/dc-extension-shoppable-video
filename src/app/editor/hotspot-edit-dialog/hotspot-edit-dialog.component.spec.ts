import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SetHotspotInfoCommand } from 'src/app/services/editor-commands/hotspot-commands';

import { HotspotEditDialogComponent } from './hotspot-edit-dialog.component';

describe('HotspotEditDialogComponent', () => {
  let component: HotspotEditDialogComponent;
  let fixture: ComponentFixture<HotspotEditDialogComponent>;

  beforeEach(async () => {
    const exampleHotspot = {
      timeline: { points: [] },
      target: 'target',
      selector: '.selector'
    };

    await TestBed.configureTestingModule({
      declarations: [ HotspotEditDialogComponent ],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: new SetHotspotInfoCommand(exampleHotspot, '.selector', 'target', undefined) }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HotspotEditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
