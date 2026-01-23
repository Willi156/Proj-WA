import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarouselSection } from './carousel-section';

describe('CarouselSection', () => {
  let component: CarouselSection;
  let fixture: ComponentFixture<CarouselSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarouselSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarouselSection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
