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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
