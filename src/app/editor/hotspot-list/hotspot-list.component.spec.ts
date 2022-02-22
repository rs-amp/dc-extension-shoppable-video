import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotspotListComponent } from './hotspot-list.component';

describe('HotspotListComponent', () => {
  let component: HotspotListComponent;
  let fixture: ComponentFixture<HotspotListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HotspotListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HotspotListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
