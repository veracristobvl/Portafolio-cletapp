import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Camera, CameraOptions, CameraResultType, CameraSource } from '@capacitor/camera';
import { LoadingController, ToastController } from '@ionic/angular';
import {getFirestore,collection,addDoc,doc,getDoc,updateDoc,query,where,getDocs,setDoc} from 'firebase/firestore';
import { FotoService } from 'src/app/services/fotos.service';
import { LoaderToastService } from 'src/app/services/loader_toast.service';
@Component({
  selector: 'app-agregarlugar',
  templateUrl: './agregarlugar.page.html',
  styleUrls: ['./agregarlugar.page.scss'],
})
export class AgregarlugarPage implements OnInit {
  // Variables
  formularioAgregarLugar: FormGroup;
  formularioFotos: FormGroup;
  mostrarMasOpciones = false;
  
  fotos: any = [];

  // Constructor
  constructor(
    private route: ActivatedRoute,
    private router:Router, 
    private formBuilder: FormBuilder,
    private fotoService: FotoService, 
    private loadertoastService: LoaderToastService
  ){}
  ngOnInit() {
    const direccion = this.route.snapshot.paramMap.get('direccion')
    const lat = this.route.snapshot.paramMap.get('lat')
    const lng = this.route.snapshot.paramMap.get('lng')

    this.formularioAgregarLugar = new FormGroup({
      nombre: new FormControl('', [Validators.required, Validators.minLength(3)]),
      direccion: new FormControl(direccion || '', [Validators.required, Validators.minLength(3)]),
      informacion_adicional: new FormControl(),
      tipotarifa: new FormControl('', []),
      valor: new FormControl('', []),
      periodopago: new FormControl('', []),
      techado: new FormControl('', []),
      fotos: this.formBuilder.array([]),
      latitude: new FormControl(lat,),
      longitude: new FormControl(lng,)
    });
    this.formularioFotos = new FormGroup({
      idLugar: new FormControl('', ),
      fotos: this.formBuilder.array([]),
    });

  }
  // Metodo con el que se muestran más opciones de informacion para agregar al lugar
  toggleMostrarOpciones() {
    this.mostrarMasOpciones = !this.mostrarMasOpciones
  }
  eliminarImagen(index: number) {
    this.fotos.splice(index,1);
  }
  
  async tomarFoto() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera
    });
    this.fotos.push(image.dataUrl);
  }
  
  
  async guardarLugar() {
    if (this.formularioAgregarLugar.valid) {
      this.loadertoastService.presentLoader('')
      const fotosArray = this.formularioFotos.get('fotos') as FormArray;
      const docRef =  await addDoc(collection(getFirestore(), 'lugares'), this.formularioAgregarLugar.value);
      const idLugar = docRef.id;
      this.formularioFotos.patchValue({ idLugar });
      
      try {
        for (let foto of this.fotos){
          const blob = this.fotoService.dataURItoBlob(foto);
          const path = `fotos/${docRef.id}`;
          const url = await this.fotoService.subirFoto(blob, path);
          fotosArray.push(this.formBuilder.control(url))
        }
        this.loadertoastService.dismiss()
        await this.loadertoastService.presentToast('middle', 'Estacionamiento guardado con éxito!', 3000)
        this.router.navigate(['/home'])
        
      } catch (error) {
        console.error('Error al agregar el lugar: ', error);
      }
      const fotosdocRef = doc(getFirestore(), 'fotos', idLugar);
      await setDoc(fotosdocRef, this.formularioFotos.value)
      //await addDoc(collection(getFirestore(), 'fotos'), this.formularioFotos.value);
    }
  }

  

 
}

