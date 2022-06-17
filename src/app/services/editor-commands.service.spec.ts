import { TestBed } from '@angular/core/testing';

import { EditorCommandsService } from './editor-commands.service';

describe('EditorCommandsService', () => {
  let service: EditorCommandsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EditorCommandsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
