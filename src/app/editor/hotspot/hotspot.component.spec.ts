import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotspotComponent } from './hotspot.component';

describe('HotspotComponent', () => {
  let component: HotspotComponent;
  let fixture: ComponentFixture<HotspotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HotspotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HotspotComponent);
    component = fixture.componentInstance;
    component.hotspot = {
      timeline: { points: [] },
      target: 'target',
      selector: '.selector'
    }
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
