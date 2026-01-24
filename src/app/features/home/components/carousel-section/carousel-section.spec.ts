import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarouselSectionComponent } from './carousel-section';

describe('CarouselSection', () => {
  let component: CarouselSectionComponent;
  let fixture: ComponentFixture<CarouselSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarouselSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarouselSectionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
