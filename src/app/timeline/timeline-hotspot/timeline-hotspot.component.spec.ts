import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimelineHotspotComponent } from './timeline-hotspot.component';

describe('TimelineHotspotComponent', () => {
  let component: TimelineHotspotComponent;
  let fixture: ComponentFixture<TimelineHotspotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TimelineHotspotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TimelineHotspotComponent);
    component = fixture.componentInstance;
    component.hotspot = {
      timeline: { points: [] },
      target: 'target',
      selector: '.selector'
    }
    component.rangeOffset = 0;
    component.rangeWidth = 1;
    component.width = 500;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
