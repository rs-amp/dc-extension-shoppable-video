import { EventEmitter, Injectable } from '@angular/core';
import {
  init,
  ModelChangeDispose,
  VisualizationSDK,
} from 'dc-visualization-sdk';
import { ExtensionSdkService } from '../field/extension-sdk.service';
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

  private validateAndSet(model: any): void {
    this.model = ExtensionSdkService.validateData(model);
  }

  public async getSDK(): Promise<VisualizationSDK> {
    if (this.sdk == null) {
      this.sdk = init();

      this.sdk = this.sdk.then(async (sdk) => {
        this.validateAndSet((await sdk.form.get()).content[fieldName]);
        this.unsubscribe = sdk.form.changed((model) => {
          this.validateAndSet(model.content[fieldName]);
          this.changed.emit(this.model);
        });
        return sdk;
      });
    }

    return await this.sdk;
  }
}
