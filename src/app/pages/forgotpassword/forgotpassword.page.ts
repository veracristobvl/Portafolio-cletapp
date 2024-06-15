import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-forgotpassword',
  templateUrl: './forgotpassword.page.html',
  styleUrls: ['./forgotpassword.page.scss'],
})
export class ForgotpasswordPage implements OnInit {
  formularioResetPassword : FormGroup;
  emailEnviado: boolean = false;
  email:string =''
  constructor(private authservice: AuthService, private router: Router, private loadingCtrl: LoadingController,) {
  
    // Configuración de formulario
    this.formularioResetPassword = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email])
    });
  }
  ngOnInit() {
  }

  async sendResetEmail() {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando...',
      duration: 0,
    });
    const { email } = this.formularioResetPassword.value
    this.email = email
    await loading.present()


    this.authservice
      .forgotPassword(email)
      .then(() => {
        loading.dismiss()
        this.emailEnviado = true
      })
      .catch((err) => {
        console.error('Error al enviar el correo de restablecimiento:', err);
        // Puedes mostrar un mensaje de error aquí si lo deseas
      });
  }
}
