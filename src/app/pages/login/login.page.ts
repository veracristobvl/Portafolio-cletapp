import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { LoadingController, Platform, ToastController } from '@ionic/angular';
import { Auth, browserLocalPersistence, browserSessionPersistence, setPersistence, signInWithEmailAndPassword, } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  formularioLogin: FormGroup;
  email: string = '';
  password: string = '';
  emailRecuperacion: string = '';
  mostrarFormulario: boolean = false;
  showPassword = false;
  shouldShowMenu
  constructor(
    private router: Router,
    private authservice: AuthService,
    private platform: Platform,
    private afAuth: Auth,
    private toastController: ToastController,
    private loadingCtrl: LoadingController,

  ) {
    // Configuración de formulario
    this.formularioLogin = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
      ]),
      recordarme: new FormControl(false)
    });
  }


  async login() {
    this.presentLoader('Iniciando sesión...')
    
    const { email, password, recordarme } = this.formularioLogin.value
    
      if (!recordarme){
        this.afAuth.setPersistence(browserSessionPersistence).then(() => {
          this.authservice.login(email,password).then((res) => {
            console.log(res);
            this.loadingCtrl.dismiss()
            this.router.navigate(['/home']);
          }).catch((err) => {
            console.log(err)
            this.loadingCtrl.dismiss()
          });
        })
      }else{
        this.afAuth.setPersistence(browserLocalPersistence).then(() => {
          this.authservice.login(email,password).then((res) => {
            this.loadingCtrl.dismiss()
            this.router.navigate(['/home']);
          }).catch((err) =>{
            console.log(err)
            this.loadingCtrl.dismiss()
          } );
        })
      }

  }
  
  async presentLoader(mensaje){
    const loading = await this.loadingCtrl.create({
      message: mensaje,
    });
    return await loading.present()
  }
  loginAsGuest() {
    this.authservice
      .loginAsGuest()
      .then((res) => {
        console.log(res);
        this.router.navigate(['/home']);
      })
      .catch((err) => console.log(err));
  }

  loginWithGoogle() {
    this.authservice.signInWithGoogle().then((res) => {
      this.router.navigate(['/home']);
    });
  }

  loginWithFacebook() {
    this.authservice.signInWithFacebook().then((res) => {
      this.router.navigate(['/home']);
    });
  }

  forgotPassword(event: Event) {
    event.preventDefault()
    this.mostrarFormulario = true;
  }

  sendResetEmail() {
    if (!this.emailRecuperacion) {
      console.error('Por favor, ingrese un correo electrónico válido');
      // Puedes mostrar un mensaje de error aquí si lo deseas
      return;
    }

    this.authservice
      .forgotPassword(this.emailRecuperacion)
      .then(() => {
        console.log('Correo de restablecimiento enviado');
        // Puedes mostrar un mensaje de éxito aquí si lo deseas
        this.mostrarFormulario = false; // Ocultar el formulario después de enviar el correo
      })
      .catch((err) => {
        console.error('Error al enviar el correo de restablecimiento:', err);
        // Puedes mostrar un mensaje de error aquí si lo deseas
      });
  }

  onClick() {
    this.router.navigate(['/registro']);
  }

  ngOnInit() { }



  async presentToast(position: 'top' | 'middle' | 'bottom', mensaje, duration) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: duration,
      position: position,
    });

    await toast.present();
  }
  togglePasswordVisibility(){
    this.showPassword = !this.showPassword
    console.log(this.showPassword)
  }
}
