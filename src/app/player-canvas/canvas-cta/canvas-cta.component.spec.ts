import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanvasCtaComponent } from './canvas-cta.component';

describe('CanvasCtaComponent', () => {
  let component: CanvasCtaComponent;
  let fixture: ComponentFixture<CanvasCtaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CanvasCtaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CanvasCtaComponent);
    component = fixture.componentInstance;
    component.cta = {
      caption: 'caption',
      value: 'value'
    },
    component.vis = false,
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
