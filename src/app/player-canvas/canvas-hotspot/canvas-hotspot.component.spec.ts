import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanvasHotspotComponent } from './canvas-hotspot.component';

describe('CanvasHotspotComponent', () => {
  let component: CanvasHotspotComponent;
  let fixture: ComponentFixture<CanvasHotspotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CanvasHotspotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CanvasHotspotComponent);
    component = fixture.componentInstance;
    component.selected = false,
    component.ghost = false,
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
