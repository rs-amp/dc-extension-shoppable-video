import { EventEmitter, Injectable } from '@angular/core';
import { MediaImageLink } from 'dc-extensions-sdk/dist/types/lib/components/MediaLink';
import { Subject, interval } from 'rxjs';
import { debounce } from 'rxjs/operators';
import { ExtensionSdkService } from '../field/extension-sdk.service';
import { ShoppableVideoData } from '../field/model/shoppable-video-data';
import { VisualizationSdkService } from './visualization-sdk.service';

const baseVideo: ShoppableVideoData = {
  video: { _meta: { schema: 'http://bigcontent.io/cms/schema/v1/core#/definitions/video-link' }, _empty: true } as any,
  hotspots: []
}

@Injectable({
  providedIn: 'root'
})
export class FieldService {
  fieldUpdated: EventEmitter<ShoppableVideoData> = new EventEmitter();
  data: ShoppableVideoData = JSON.parse(JSON.stringify(baseVideo));
  stagingEnvironment?: string;

  private updateInProgress = false;
  private updated = new Subject();
  private extensionSize = 0;

  constructor(private sdk: ExtensionSdkService, private vis: VisualizationSdkService) {
    if (vis.active) {
      vis.getSDK().then(async () => {
        this.stagingEnvironment = vis.vse || '';
        if (vis.model != null) {
          this.data = vis.model;
          this.updateField();
        }
        vis.changed.subscribe(model => {
          this.data = vis.model as ShoppableVideoData;
          this.updateField();
        });
      });
    } else {
      const db = this.updated.pipe(debounce(() => interval(100)));
      db.subscribe(async () => {
        const sdkInstance = await this.sdk.getSDK();
        sdkInstance.field.setValue(this.data);
      });

      sdk.getSDK().then(async (sdkInstance) => {
        //sdkInstance.frame.startAutoResizer();
        this.calculateExtensionSize();
        this.stagingEnvironment = sdkInstance.stagingEnvironment;
        this.loadParams({ ...sdkInstance.params.installation, ...sdkInstance.params.instance });
        this.data = await sdkInstance.field.getValue();
        this.updateField();
      });
    }
  }

  getVideoHost(forcePublished = false): string | null {
    const stagingEnvironment = forcePublished ? null : this.stagingEnvironment;
    return stagingEnvironment || ((this.data && this.data.video) ? (this.data.video as MediaImageLink).defaultHost : null);
  }

  private loadParams(params: any) {
    if (params.customVSE) {
      this.stagingEnvironment = params.customVSE;
    }
    if (!params.useVSE) {
      this.stagingEnvironment = undefined;
    }
  }

  private async calculateExtensionSize(): Promise<void> {
    const titleSize = 30;
    const videoSize = 500;
    const controlsSize = 48;
    const hotspotSize = 34;
    const addSizeExtra = 40;

    const size = titleSize + videoSize + controlsSize + hotspotSize * this.data.hotspots.length + addSizeExtra;

    if (size != this.extensionSize) {
      this.extensionSize = size;

      const sdk = await this.sdk.getSDK();

      sdk.frame.setHeight(size);
    }
  }

  async updateField() {
    this.calculateExtensionSize();

    if (this.updateInProgress) {
      return;
    }
    this.updateInProgress = true;
    this.fieldUpdated.emit(this.data);
    this.updated.next(true);
    this.updateInProgress = false;
  }

  async resetDefault() {
    this.data = JSON.parse(JSON.stringify(baseVideo));
    await this.updateField();
  }
}
