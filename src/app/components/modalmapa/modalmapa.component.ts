import { Component, OnInit, Input  } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-modalmapa',
  templateUrl: './modalmapa.component.html',
  styleUrls: ['./modalmapa.component.scss'],
})
export class ModalmapaComponent  implements OnInit {

  constructor(private modalController: ModalController) { }
  @Input() latitude: number;
  ngOnInit() {}
  async dismiss() {
    await this.modalController.dismiss();
  }
}
