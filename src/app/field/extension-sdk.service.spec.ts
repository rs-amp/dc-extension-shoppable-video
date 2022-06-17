import { TestBed } from '@angular/core/testing';

import { ExtensionSdkService } from './extension-sdk.service';

describe('ExtensionSdkService', () => {
  let service: ExtensionSdkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExtensionSdkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
