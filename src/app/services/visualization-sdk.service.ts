import { EventEmitter, Injectable } from '@angular/core';
import {
  init,
  ModelChangeDispose,
  VisualizationSDK,
} from 'dc-visualization-sdk';
import { ShoppableVideoData } from '../field/model/shoppable-video-data';

const fieldName = 'shoppableVideo';

@Injectable({
  providedIn: 'root',
})
export class VisualizationSdkService {
  private sdk?: Promise<VisualizationSDK>;
  private unsubscribe?: ModelChangeDispose;
  public model?: ShoppableVideoData;
  public changed: EventEmitter<ShoppableVideoData>;

  public get vse(): string | null {
    const params = new URL(document.location.href).searchParams;
    const vse = params.get('vse');

    return vse;
  }

  public get active(): boolean {
    return this.vse != null;
  }

  constructor() {
    this.changed = new EventEmitter();

    if (this.active) {
      this.sdk = this.getSDK();
    }
  }

  public async getSDK(): Promise<VisualizationSDK> {
    if (this.sdk == null) {
      this.sdk = init();

      this.sdk = this.sdk.then(async (sdk) => {
        this.model = (await sdk.form.get()).content[
          fieldName
        ] as ShoppableVideoData;
        this.unsubscribe = sdk.form.changed((model) => {
          this.model = model.content[fieldName] as ShoppableVideoData;
          this.changed.emit(this.model);
        });
        return sdk;
      });
    }

    return await this.sdk;
  }
}
