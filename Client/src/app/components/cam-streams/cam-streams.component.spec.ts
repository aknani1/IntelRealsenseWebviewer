import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CamStreamsComponent } from './cam-streams.component';

describe('CamStreamsComponent', () => {
  let component: CamStreamsComponent;
  let fixture: ComponentFixture<CamStreamsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CamStreamsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CamStreamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
