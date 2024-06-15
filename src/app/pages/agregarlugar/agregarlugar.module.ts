import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AgregarlugarPageRoutingModule } from './agregarlugar-routing.module';

import { AgregarlugarPage } from './agregarlugar.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AgregarlugarPageRoutingModule
  ],
  declarations: []
})
export class AgregarlugarPageModule {}
