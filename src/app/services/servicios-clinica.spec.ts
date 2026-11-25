import { TestBed } from '@angular/core/testing';
import { ServiciosClinica } from './servicios-clinica';

describe('ServiciosClinica', () => {
  let service: ServiciosClinica;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiciosClinica);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
