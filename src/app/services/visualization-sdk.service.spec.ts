import { TestBed } from '@angular/core/testing';

import { VisualizationSdkService } from './visualization-sdk.service';

describe('VisualizationSdkService', () => {
  let service: VisualizationSdkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisualizationSdkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
