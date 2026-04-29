import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyzerComponent } from './analyzer';

describe('AnalyzerComponent', () => {
  let component: AnalyzerComponent;
  let fixture: ComponentFixture<AnalyzerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyzerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnalyzerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
