import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayDetails } from './overlay-details';

describe('OverlayDetails', () => {
  let component: OverlayDetails;
  let fixture: ComponentFixture<OverlayDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverlayDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OverlayDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
