import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScreenService {

  width!: number;
  height!: number;
  sizeUpdated = new EventEmitter<boolean>();

  private resizeBound!: () => void;

  constructor() {
    this.resizeBound = this.updateSize.bind(this);
    window.addEventListener('resize', this.resizeBound);

    this.updateSize();
  }

  updateSize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.sizeUpdated.emit(true);
  }
}
