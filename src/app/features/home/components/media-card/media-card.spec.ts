import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaCardComponent } from './media-card';

describe('MediaCard', () => {
  let component: MediaCardComponent;
  let fixture: ComponentFixture<MediaCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MediaCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
