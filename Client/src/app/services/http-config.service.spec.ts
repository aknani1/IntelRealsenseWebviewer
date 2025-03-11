import { TestBed } from '@angular/core/testing';

import { HttpConfigService } from './http-config.service';

describe('HttpConfigService', () => {
  let service: HttpConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HttpConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
