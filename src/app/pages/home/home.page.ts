import {
  Component,
  OnInit,
  ElementRef,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import {
  IonModal,
  LoadingController,
  ModalController,
  Platform,
  ToastController,
} from '@ionic/angular';
import { InfoPanelComponent } from '../info-panel/info-panel.component';
import { mapConfiguration } from './map-config';
import { MapService } from 'src/app/services/map.service';
import { GoogleMap } from '@capacitor/google-maps';
import { ModalmapaComponent } from 'src/app/components/modalmapa/modalmapa.component';
import { HttpClient } from '@angular/common/http';
import { NavigationStart, Router } from '@angular/router';
import { LoaderToastService } from 'src/app/services/loader_toast.service';
import { getDownloadURL, getStorage, list, listAll, ref, } from 'firebase/storage';
import { Storage } from '@angular/fire/storage';
import { finalize, switchMap } from 'rxjs/operators';
import { Observable, forkJoin, from } from 'rxjs';
import { addDoc, collection, doc, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { idToken } from '@angular/fire/auth';
import { AuthService } from 'src/app/services/auth.service';
declare var google: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  @ViewChild('modal') modalAgregarLugar: IonModal;
  @ViewChild('modal2') modalEstacionamiento: IonModal;
  @ViewChild('map', { static: false }) mapElement: ElementRef;
  @ViewChild('streetView', { static: false }) streetView: ElementRef;
  // Variables para construir mapa
  map: any = null; // Utilizamos 'any' en lugar de ''
  mapConfiguration: any[] = mapConfiguration;

  // Variables para Ubicacion
  myLatLng: any;
  location: any;
  clickedLocation: google.maps.LatLng

  // Variables para marcadores 
  selfmarker: any = null;
  clickedmarker: any = null;
  markers: any[] = [];
  markerComments: { [key: string]: string[] } = {}; // Definimos markerComments aquí



  // Variables para buscador
  autocompleteService = new google.maps.places.AutocompleteService()
  placesService = new google.maps.places.PlacesService()
  predictions: any = [];
  imageurl: string;
  searchQuery: string = '';

  // Variables para informacion de modal de lugar clickeado
  duracion: number;
  distancia: number;
  comuna: string;
  direccion: string;
  // Otras...
  mostrarFormulario = false;
  lugares = [];
  activeLugar: any = {}
  rating: number;
  comentario = ''
  comentarios = []


  constructor(
    private cdr: ChangeDetectorRef,
    private loadingCtrl: LoadingController,
    private mapService: MapService,
    private router: Router,
    private loadertoastController: LoaderToastService,
    private storage: Storage,
    private authService: AuthService
  ) { }

  async ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.fetchLugares();
        console.log('Refresh...')
      }
    })
    try {
      await this.loadertoastController.presentLoader('Cargando mapa')
      await this.loadMap();
      this.fetchLugares();
    } catch (error) {
      console.error('Error al cargar el mapa:', error);
    }
    // Oculta el loader cuando finalice la carga del mapa
    await this.loadertoastController.dismiss();
  }

  // --------------------- Métodos de Mapa --------------------------------

  async loadMap() {
    // Elemento html donde se mostrará el mapa
    const mapEle: HTMLElement = document.getElementById('map')!;
    // 
    this.map = new google.maps.Map(mapEle, {
      zoom: 15,
      disableDefaultUI: true,
      styles: this.mapConfiguration,
    });

    // Obtener la ubicación actual y crear el marcador
    this.obtenerUbicacionYCrearMarcador()
    // Método que lleva mapa creado a "mapService" 
    this.mapService.setMap(this.map);

    // Agregar Evento click al mapa
    google.maps.event.addListenerOnce(this.map, 'idle', () => {
      google.maps.event.addListener(this.map, 'click', (event: any) => {
        this.clickedLocation = event.latLng
        this.addClickedMarker()
        this.openModal()

        this.cdr.detectChanges();
      });
    }); (error) => {
      console.error('Error al obtener la ubicación:', error);
    };

    // Actualizar la ubicación cada 2 segundos
    setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.updateMarker(position);
        },
        (error) => {
          console.error('Error al obtener la ubicación:', error);
        }
      );
    }, 2000);

  }


  obtenerUbicacionYCrearMarcador() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.myLatLng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        this.location = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

        this.selfmarker = new google.maps.Marker({
          position: this.myLatLng,
          map: this.map,
          title: 'Ubicación Actual',
          icon: {
            url: 'https://storage.googleapis.com/cletapp-images/location-image.gif', // Ruta al GIF animado
            scaledSize: new google.maps.Size(50, 50), // Tamaño del icono
          },
        });
        this.map.setCenter(this.myLatLng);
        //this.updateMarker(position);
      },
      (error) => {
        console.error('Error al obtener la ubicación', error);
      }
    );
  }

  // --------------------- Métodos de Marcador --------------------------------
  async addMarker(lat, lng, id) {
    const markerPosition = { lat: lat, lng: lng }
    const marker = new google.maps.Marker({
      position: markerPosition,
      map: this.map,
    });


    await marker.addListener('click', () => {
      this.setEstacionamientoClickeado(id)
      this.getDistance(+this.activeLugar.latitude, +this.activeLugar.longitude)
      this.getComentarios(id)
      this.openModalEstacionamiento()
      console.log(this.activeLugar)
    })
  }

  // Agrega Marcador en lugar clicckeado
  async addClickedMarker() {
    if (this.clickedmarker) {
      this.clickedmarker.setMap(null); // Elimina el marcador anterior si existe
    }
    this.clickedmarker = new google.maps.Marker({
      position: this.clickedLocation,
      map: this.map,
    });

    const service = new google.maps.DistanceMatrixService();
    this.getDistance(this.clickedLocation.lat(), this.clickedLocation.lng())
    this.clickedmarker.addListener('click', () => {
      this.openModal()
    })
  }

  // Método que actualiza la latitud y longitud del marcador del usuario.
  updateMarker(position) {
    const latitude = position.coords.latitude
    const longitude = position.coords.longitude
    if (this.selfmarker) {
      this.myLatLng = { lat: latitude, lng: longitude };
      this.animateMarker(this.selfmarker, this.myLatLng, 1000)
      //this.marker.setPosition(myLatLng);

    } else {
      this.selfmarker = new google.maps.Marker({
        position: this.myLatLng,
        map: this.map,
        title: 'Ubicación Actual',
        icon: {
          url: 'https://storage.cloud.google.com/imagenes-cletapp/location-image.gif', // Ruta al GIF animado
          scaledSize: new google.maps.Size(50, 50), // Tamaño del icono
        },
      });
    }
    this.mapService.setCurrentPosition(this.myLatLng)
  }

  // Método que anima transición de marcador al moverse de un punto a otro 
  private animateMarker(marker: any, newLatLng: any, duration: number) {
    const startPosition = marker.getPosition() as google.maps.LatLng;
    const startLat = startPosition.lat();
    const startLng = startPosition.lng();
    const endLat = newLatLng.lat;
    const endLng = newLatLng.lng;

    const deltaLat = endLat - startLat;
    const deltaLng = endLng - startLng;

    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / duration;

      if (progress < 1) {
        const newLat = startLat + deltaLat * progress;
        const newLng = startLng + deltaLng * progress;
        marker.setPosition({ lat: newLat, lng: newLng });
        requestAnimationFrame(step);
      } else {
        marker.setPosition(newLatLng);
      }
    };
    requestAnimationFrame(step);
  }

  setEstacionamientoClickeado(id) {
    for (let lugar of this.lugares) {
      if (lugar.id == id) {
        this.activeLugar = lugar
      }
    }
  }
  //Metodo que muestra streetview de punto clickeado
  showStreetView(location) {
    if (this.streetView) {
      // Lógica para inicializar Street View
      const panorama = new google.maps.StreetViewPanorama(
        this.streetView.nativeElement,
        {
          position: location,
          pov: { heading: 165, pitch: 0 },
          zoom: 1,
          zoomControl: false, // Deshabilitar control de zoom
          fullscreenControl: false, // Deshabilitar control de pantalla completa
          addressControl: false, // Deshabilitar texto inferior con la dirección
          motionTracking: false, // Deshabilitar seguimiento de movimiento
          motionTrackingControl: false, // Deshabilitar control de seguimiento de movimiento
          showRoadLabels: false, // Deshabilitar etiquetas de carretera
          linksControl: false,
          navigationControl: false
        }
      );
    }
  }

  // Método que retorna distancia y tiempo en bicicleta hasta lugar indicado por lat y lng
  getDistance(lat, lng) {
    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [this.myLatLng],
        destinations: [{ lat: lat, lng: lng }],
        travelMode: google.maps.TravelMode.BICYCLING,
      },
      (response, status) => {
        if (status !== google.maps.DistanceMatrixStatus.OK) {
          console.error('Error obteniendo la distancia', status);
          return false
        } else {
          let address = response.destinationAddresses[0]
          const direccion = address.split(',')[0]
          const comuna = isNaN(Number(address.split(',')[1].trim()[0])) ? address.split(',')[1] : address.split(',')[1].split(' ').slice(2).join(' ')
          this.direccion = direccion
          this.comuna = comuna

          let dataDistancia = response.rows[0].elements[0]
          const distancia = dataDistancia.distance.text;
          const duracion = dataDistancia.duration.text;
          this.distancia = distancia
          this.duracion = duracion
          return { comuna: comuna, direccion: direccion, distancia: distancia, duracion: duracion }
        }
      }
    );
  }
  // Método que abre modal al hacer click
  async openModal() {
    await this.modalAgregarLugar.present();
    this.showStreetView(this.clickedLocation);
  }
  async openModalEstacionamiento() {
    await this.modalEstacionamiento.present();
  }












  // --------------------- Métodos de buscador --------------------------------
  search() {
    // Verifica si el campo de búsqueda está vacío o contiene solo espacios en blanco
    if (!this.searchQuery.trim()) {
      return; // Si está vacío, no hace nada y retorna inmediatamente
    }
    // Define el objeto de solicitud con la consulta y los campos requeridos
    const request = {
      query: this.searchQuery, // Usa el término de búsqueda proporcionado por el usuario
      fields: ['name', 'geometry'], // Especifica que los resultados deben incluir el nombre y la geometría del lugar
    };
    // Crea una instancia del servicio Places de Google Maps, vinculada al mapa actual
    const service = new google.maps.places.PlacesService(this.map);
    // Llama al método findPlaceFromQuery del servicio Places para buscar lugares según la consulta
    service.findPlaceFromQuery(request, (results: any[], status: any) => {
      // Verifica si la búsqueda fue exitosa y si hay resultados
      if (
        status === google.maps.places.PlacesServiceStatus.OK && results //&& results.length
      ) {
        const place = results[0]; // Toma el primer resultado de la búsqueda
        // Si el mapa está inicializado
        if (this.map) {
          this.map.panTo(place.geometry.location); // Centra el mapa en la ubicación del lugar encontrado
          this.clickedLocation = place.geometry.location
          this.addClickedMarker()
          this.openModal()

          this.map.setZoom(15); // Ajusta el nivel de zoom a 15 para acercar el mapa
        } else {
          console.error('El mapa aún no se ha inicializado.'); // Muestra un error si el mapa no está listo
        }
      }
    });
  }


  onSearchChange() {
    if (this.searchQuery.trim() === '') {
      this.predictions = [];
      return;
    }

    this.getPlacePredictions(this.searchQuery, this.location, 1000, (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        this.predictions = predictions;
      } else {
        this.predictions = [];
      }
    });
  }

  getPlacePredictions(input: string, location?: any, radius?: number, callback?: (predictions: any, status: any) => void) {
    var southWest = new google.maps.LatLng(-33.6634, -70.9271); // Punto suroeste (ejemplo: Nueva York)
    var northEast = new google.maps.LatLng(-33.2825, -70.4959); // Punto noreste (ejemplo: Nueva York)
    var bounds = new google.maps.LatLngBounds(southWest, northEast);

    const request = {
      input: input,
      location: location,
      radius: radius,
      bounds: bounds,
      //types: ['geocode'] // Ajusta el tipo de predicción según tus necesidades
    };
    this.autocompleteService.getPlacePredictions(request, callback);
  }
  getPlaceDetails(placeId) {


    const request = {
      placeId: placeId,
      fields: ['name', 'formatted_address', 'photos'] // Ajusta los campos según tus necesidades
    };

    this.placesService.getDetails(request, (place, status) => {
      if (status == google.maps.places.PlacesServiceStatus.OK) {

        console.log('Nombre: ' + place.name);
        console.log('Dirección: ' + place.formatted_address);

        if (place.photos && place.photos.length > 0) {
          const photoUrl = place.photos[0].getUrl({ maxWidth: 400, maxHeight: 400 });
          console.log('Foto URL: ' + photoUrl);
          // Aquí puedes mostrar la foto y la dirección en tu UI
        }
      } else {
      }
    });
  }
  selectPrediction(prediction: any) {
    console.log(prediction)
    this.searchQuery = prediction.description;
    this.getPlaceDetails(prediction.place_id)
    //console.log(prediction.place_id)
    this.predictions = [];
  }

  // --------------------- FIN Métodos de buscador FIN --------------------------------



  // Método que crea loader y lo presenta. No se cierra sin dismiss()
  async presentLoading(message: string, duration: number) {
    const loading = await this.loadingCtrl.create({
      message: message,
      duration: duration
      // Optional configuration options (see below)
    });
    await loading.present();
  }

  // Método que redirecciona a page agregar lugar y que envía valores de direccion, lat y lng del lugar. 
  agregarLugar() {
    const direccion = this.direccion
    const position = this.clickedmarker.getPosition()
    const lat = position.lat()
    const lng = position.lng()
    this.router.navigate(['/agregarlugar', direccion, lat, lng])
    this.modalAgregarLugar.dismiss()
  }


  // Método que agrega un comentario 
  async agregarComentario() {
    //const fotosdocRef = doc(getFirestore(), 'fotos',);
    const userId = this.authService.getCurrentUser().uid;
    const lugarId = this.activeLugar.id
    const comentario = this.comentario
    const rating = this.rating
    //await addDoc(collection(getFirestore(), 'users'))

    await addDoc(collection(getFirestore(), 'comentarios'), { lugarId: lugarId, userId: userId, comentario: comentario, rating: rating })
  }

  async getComentarios(lugarId) {
    const q = query(collection(getFirestore(), "comentarios"), where("lugarId", "==", lugarId));
    const querySnapshot = await getDocs(q);
    const comentarios = []
     querySnapshot.forEach(async (doc) => {
      // doc.data() is never undefined for query doc snapshots
      let data = doc.data()
      
      const q = query(collection(getFirestore(), "users"), where("uid", "==", data['userId']));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(doc=> {
        data['userNombre'] = doc.data()['nombre'] + ' ' +doc.data()['apellido']
        this.authService.obtenerURLFotoPerfil(doc.data()['uid']).then(url=>{
          data['photoUrl'] = url
        })
      })
      console.log(data);
      comentarios.push(data)
    });
    this.comentarios = comentarios

  }
  // Método que consigue los lugares de la base de datos y los trae a variable local. 
  //Luego se recorre esa variable con información de los lugares y se agrega un marcador con metodo addMarker() por cada uno de los elementos
  async fetchLugares() {
    try {
      const lugares = await this.mapService.getLugares();
      this.lugares = lugares
      lugares.forEach(lugar => {
        this.addMarker(+lugar.latitude, +lugar.longitude, lugar.id)
      })
    } catch (error) {
      console.error("Error getting documents: ", error);
    }
  }
}
