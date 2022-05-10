import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoSelectDialogComponent } from './video-select-dialog.component';

describe('VideoSelectDialogComponent', () => {
  let component: VideoSelectDialogComponent;
  let fixture: ComponentFixture<VideoSelectDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VideoSelectDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoSelectDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
