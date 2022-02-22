import { Injectable } from '@angular/core';
import { ContentFieldExtension, init } from 'dc-extensions-sdk';
import { ShoppableVideoData } from './model/shoppable-video-data';
import { ShoppableVideoParams } from './model/shoppable-video-params';

type SDKType = ContentFieldExtension<ShoppableVideoData, ShoppableVideoParams>;

@Injectable({
  providedIn: 'root'
})
export class ExtensionSdkService {
  private sdk: Promise<SDKType>;
  constructor() {
    this.sdk = this.getSDK();
  }

  public async getSDK(): Promise<SDKType> {
    if (this.sdk == null) {
      this.sdk = init();
    }
    return await this.sdk;
  }
}
