import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CamViewerComponent } from './cam-viewer.component';

describe('CamViewerComponent', () => {
  let component: CamViewerComponent;
  let fixture: ComponentFixture<CamViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CamViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CamViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
