import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanvasCtaDialogComponent } from './canvas-cta-dialog.component';

describe('CanvasCtaDialogComponent', () => {
  let component: CanvasCtaDialogComponent;
  let fixture: ComponentFixture<CanvasCtaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CanvasCtaDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CanvasCtaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
