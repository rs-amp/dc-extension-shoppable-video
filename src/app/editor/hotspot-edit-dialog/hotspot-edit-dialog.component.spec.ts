import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotspotEditDialogComponent } from './hotspot-edit-dialog.component';

describe('HotspotEditDialogComponent', () => {
  let component: HotspotEditDialogComponent;
  let fixture: ComponentFixture<HotspotEditDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HotspotEditDialogComponent ]
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
