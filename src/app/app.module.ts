import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { VideoPlayerComponent } from './player/video-player.component';
import { ModeButtonsComponent } from './mode-buttons/mode-buttons.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClientModule } from '@angular/common/http';
import { PlayerControlsComponent } from './player/player-controls/player-controls.component';
import { TimelineScrubberComponent } from './timeline/timeline-scrubber/timeline-scrubber.component';
import { TimelineComponent } from './timeline/timeline.component';
import { EditorComponent } from './editor/editor.component';
import { HotspotListComponent } from './editor/hotspot-list/hotspot-list.component';
import { HotspotComponent } from './editor/hotspot/hotspot.component';
import { TimelineBackgroundComponent } from './timeline/timeline-background/timeline-background.component';
import { TimelineHotspotComponent } from './timeline/timeline-hotspot/timeline-hotspot.component';
import { PlayerCanvasComponent } from './player-canvas/player-canvas.component';
import { CanvasHotspotComponent } from './player-canvas/canvas-hotspot/canvas-hotspot.component';
import { CanvasCtaComponent } from './player-canvas/canvas-cta/canvas-cta.component';
import { HotspotEditDialogComponent } from './editor/hotspot-edit-dialog/hotspot-edit-dialog.component';
import { ToolbarComponent } from './toolbar/toolbar.component';

@NgModule({
  declarations: [
    AppComponent,
    VideoPlayerComponent,
    ModeButtonsComponent,
    PlayerControlsComponent,
    TimelineScrubberComponent,
    TimelineComponent,
    EditorComponent,
    HotspotListComponent,
    HotspotComponent,
    TimelineBackgroundComponent,
    TimelineHotspotComponent,
    PlayerCanvasComponent,
    CanvasHotspotComponent,
    CanvasCtaComponent,
    HotspotEditDialogComponent,
    ToolbarComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatTooltipModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
