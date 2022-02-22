import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimelineBackgroundComponent } from './timeline-background.component';

describe('TimelineBackgroundComponent', () => {
  let component: TimelineBackgroundComponent;
  let fixture: ComponentFixture<TimelineBackgroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TimelineBackgroundComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TimelineBackgroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
