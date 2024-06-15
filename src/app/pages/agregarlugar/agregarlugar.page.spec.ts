import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgregarlugarPage } from './agregarlugar.page';

describe('AgregarlugarPage', () => {
  let component: AgregarlugarPage;
  let fixture: ComponentFixture<AgregarlugarPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AgregarlugarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
