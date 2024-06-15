import { Injectable } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { LoadingController, ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class LoaderToastService {
  constructor(private loadingCtrl:LoadingController, private toastController: ToastController) {}

  // Presentador de loader
  async presentLoader(mensaje){
    const loading = await this.loadingCtrl.create({
      message: mensaje,
    });
    return await loading.present()
  }
  // Presentador de mensajes de confirmación o error
  async presentToast(position: 'top' | 'middle' | 'bottom', mensaje, duration) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: duration,
      position: position,
    });
    await toast.present();
  }
  dismiss(){
    this.loadingCtrl.dismiss()
  }
}
