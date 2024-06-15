import { Injectable } from '@angular/core';
import { Storage,getDownloadURL,ref,uploadBytes } from '@angular/fire/storage';
import { finalize } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FotoService {
  constructor(private storage: Storage) {}

  async subirFoto(file: Blob, path: string) {
    const filePath = `${path}/${new Date().getTime()}`;
    const fileRef =  ref(this.storage, filePath) //this.storage.ref(filePath);
    // Subir el archivo
    await uploadBytes(fileRef, file);
    // Obtener la URL de descarga
    const downloadURL = await getDownloadURL(fileRef);
    
    return downloadURL
  }

   // Convertir data URL a Blob
   dataURItoBlob(dataURI: string): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }

    return new Blob([arrayBuffer], { type: mimeString });
  }
}
