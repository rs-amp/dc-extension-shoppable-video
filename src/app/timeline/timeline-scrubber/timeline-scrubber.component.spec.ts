import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimelineScrubberComponent } from './timeline-scrubber.component';

describe('TimelineScrubberComponent', () => {
  let component: TimelineScrubberComponent;
  let fixture: ComponentFixture<TimelineScrubberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TimelineScrubberComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TimelineScrubberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
