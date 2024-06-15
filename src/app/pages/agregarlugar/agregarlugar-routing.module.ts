import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AgregarlugarPage } from './agregarlugar.page';

const routes: Routes = [
  {
    path: '',
    component: AgregarlugarPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AgregarlugarPageRoutingModule {}
