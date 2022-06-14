import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ContentEditorExtension,
  ContentFieldExtension,
  init,
} from 'dc-extensions-sdk';
import { VideoSelectDialogComponent } from '../video-select-dialog/video-select-dialog.component';
import { ShoppableVideoData } from './model/shoppable-video-data';
import { ShoppableVideoParams } from './model/shoppable-video-params';
import * as jp from 'jsonpath';

type SDKType = ContentFieldExtension<ShoppableVideoData, ShoppableVideoParams>;
type SDKTypeEditor = ContentEditorExtension<ShoppableVideoParams>;

const fieldName = 'shoppableVideo';
const partialName = '#/definitions/shoppableVideo';
const extensionNames = ['shoppable-video', 'shoppable-video-localhost'];

export interface VideoSelection {
  path: string;
  pathElements: (string | number)[];
  title: string | undefined;
  description: string | undefined;
  data: ShoppableVideoData;
}

export interface VideoPath {
  path: string;
  pathElements: (string | number)[];
  title: string | undefined;
  description: string | undefined;
}

@Injectable({
  providedIn: 'root',
})
export class ExtensionSdkService {
  isEditor = false;

  get hasMultipleVideos(): boolean {
    return this.selections != null && this.selections.length > 1;
  }

  private sdk: Promise<SDKType>;
  private activeVideo?: VideoSelection;
  private selections?: VideoSelection[];
  private onSelectionChange?: (data: ShoppableVideoData, newField?: boolean) => void;

  constructor(private dialog: MatDialog) {
    this.sdk = this.getSDK();
  }

  public async getSDK(): Promise<SDKType> {
    if (this.sdk == null) {
      this.sdk = init();

      const result = await this.sdk;

      this.isEditor = result.field == null;

      return result;
    }

    return await this.sdk;
  }

  private asEditor(sdk: SDKType): SDKTypeEditor {
    return sdk as any as SDKTypeEditor;
  }

  public static validateData(data: ShoppableVideoData): ShoppableVideoData {
    if (data == null) {
      return data;
    }

    if (data.hotspots == null) {
      data.hotspots = [];
    }

    for (let hotspot of data.hotspots) {
      if (hotspot.timeline == null) {
        hotspot.timeline = {
          points: []
        }
      }
    }

    return data;
  }

  private getValueFromForm(form: any): ShoppableVideoData {
    if (this.activeVideo) {
      return ExtensionSdkService.validateData(jp.query(form, this.activeVideo.path)[0]);
    }

    return ExtensionSdkService.validateData(form[fieldName]);
  }

  private ensurePathExists(form: any) {
    if (this.activeVideo) {
      let current = form;
      const elements = this.activeVideo.pathElements;

      for (let i=0; i<elements.length; i++) {
        let newValue: any;
        if (i < elements.length - 1 && typeof elements[i + 1] === 'number') {
          newValue = [];
        } else {
          newValue = {};
        }

        const element = elements[i];

        if (current[element] == null) {
          current[element] = newValue;
        }

        current = current[element];
      }
    }
  }

  private setValueInForm(form: any, value: ShoppableVideoData): void {
    if (this.activeVideo) {
      this.ensurePathExists(form);
      jp.apply(form, this.activeVideo.path, () => value);
      this.activeVideo.data = value;
    }
  }

  private locateVideoInSchema(
    schema: any,
    path = '$',
    pathElements: (string | number)[] = [],
    results: VideoPath[] = []
  ): VideoPath[] {
    switch (schema.type) {
      case 'object':
        if (schema.allOf) {
          // Search for ref...
          for (const def of schema.allOf) {
            if (
              def['$ref'] &&
              def['$ref'].indexOf(partialName) ===
                def['$ref'].length - partialName.length
            ) {
              results.push({
                title: schema.title,
                description: schema.description,
                path,
                pathElements
              });
              break;
            }
          }
        }

        if (
          schema['ui:extension'] &&
          schema['ui:extension'].name &&
          extensionNames.indexOf(schema['ui:extension'].name) !== -1
        ) {
          results.push({
            title: schema.title,
            description: schema.description,
            path,
            pathElements
          });
          break;
        }

        if (schema.properties) {
          for (const property of Object.keys(schema.properties)) {
            const subPath = path.length == 0 ? property : path + '.' + property;
            this.locateVideoInSchema(
              schema.properties[property],
              subPath,
              [...pathElements, property],
              results
            );
          }
        }
        break;
      case 'array':
        // TODO. Needs to search in real content item for active array indices.
        /*
        if (schema.items) {
          for (let i = 0; i < schema.items.length; i++) {
            const subPath = `${path}[${i}]`;
            this.locateVideoInSchema(schema.items[i], subPath, [...pathElements, i], results);
          }
        }
        */
        break;
    }

    return results;
  }

  public async registerValueListener(
    listener: (data: ShoppableVideoData) => void
  ): Promise<void> {
    const sdkInstance = await this.getSDK();
    if (this.isEditor) {
      const editorSDK = this.asEditor(sdkInstance);

      editorSDK.form.onModelChange((_, form) => {
        listener(this.getValueFromForm(form));
      });

      const schema = editorSDK.schema;
      const locations = this.locateVideoInSchema(schema);

      const form = await editorSDK.form.getValue();

      this.selections = locations.map(path => {
        const data = jp.query(form, path.path)[0] as ShoppableVideoData;

        return {
          data,
          ...path
        };
      });

      this.onSelectionChange = listener;

      if (this.selections.length === 1) {
        this.activeVideo = this.selections[0];
        this.onSelectionChange(this.getValueFromForm(form), true);
      } else {
        this.changeVideo();
      }
    } else {
      listener(ExtensionSdkService.validateData(await sdkInstance.field.getValue()));
    }
  }

  public async changeVideo() {
    const sdkInstance = await this.getSDK();
    if (this.isEditor && this.selections) {
      const editorSDK = this.asEditor(sdkInstance);
      const ref = this.dialog.open(VideoSelectDialogComponent, { data: this.selections, width: '500px', disableClose: true });
      ref.afterClosed().subscribe(async (choice) => {
        const form = await editorSDK.form.getValue();

        this.activeVideo = choice;
        if (this.onSelectionChange) {
          this.onSelectionChange(this.getValueFromForm(form), true);
        }
      });
    }
  }

  public async setValue(data: ShoppableVideoData): Promise<void> {
    const sdkInstance = await this.getSDK();

    if (this.isEditor) {
      const editorSDK = this.asEditor(sdkInstance);

      const form = await editorSDK.form.getValue();
      this.setValueInForm(form, data);
      await editorSDK.form.setValue(form);
    } else {
      await sdkInstance.field.setValue(data);
    }
  }
}
