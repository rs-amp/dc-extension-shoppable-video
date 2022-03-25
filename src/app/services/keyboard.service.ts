import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { EditorCommandsService } from './editor-commands.service';
import { VideoService } from './video.service';

interface KeyboardBinding {
  code: string,
  needsCtrl?: boolean,
  needsShift?: boolean,
  action: () => void
}

@Injectable({
  providedIn: 'root'
})
export class KeyboardService implements OnInit, OnDestroy {
  keyDownBind: (event: KeyboardEvent) => void;
  keyUpBind: (event: KeyboardEvent) => void;
  ignoreShortcuts = false;

  private actions: Map<string, KeyboardBinding[]>;

  constructor(private commands: EditorCommandsService, private video: VideoService) {
    this.keyDownBind = this.keyDown.bind(this);
    this.keyUpBind = this.keyUp.bind(this);

    const bindings: KeyboardBinding[] = [
      {
        code: 'KeyZ',
        needsCtrl: true,
        needsShift: true,
        action: this.redo.bind(this)
      },
      {
        code: 'KeyZ',
        needsCtrl: true,
        action: this.undo.bind(this)
      },
      {
        code: 'KeyY',
        needsCtrl: true,
        action: this.redo.bind(this)
      },
      {
        code: 'Backspace',
        action: this.delete.bind(this)
      },
      {
        code: 'Delete',
        action: this.delete.bind(this)
      },
      {
        code: 'Space',
        action: this.togglePause.bind(this)
      },
      {
        code: 'ArrowLeft',
        action: this.left5Seconds.bind(this)
      },
      {
        code: 'ArrowRight',
        action: this.right5Seconds.bind(this)
      },
      {
        code: 'Comma',
        action: this.frameRewind.bind(this)
      },
      {
        code: 'Period',
        action: this.frameAdvance.bind(this)
      },
    ];

    this.actions = new Map();

    for (const binding of bindings) {
      let codeBindings = this.actions.get(binding.code);

      if (codeBindings === undefined) {
        codeBindings = [];

        this.actions.set(binding.code, codeBindings);
      }

      codeBindings.push(binding);
    }

    this.ngOnInit();
  }

  ngOnInit(): void {
    window.addEventListener('keydown', this.keyDownBind);
    window.addEventListener('keyup', this.keyUpBind);
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.keyDownBind);
    window.removeEventListener('keyup', this.keyUpBind);
  }

  undo(): void {
    this.commands.undo();
  }

  redo(): void {
    this.commands.redo();
  }

  delete(): void {

  }

  togglePause(): void {
    if (this.video.video) {
      if (this.video.video.paused) {
        this.video.video.play();
      } else {
        this.video.video.pause();
      }
    }
  }

  left5Seconds(): void {
    this.video.changeCurrentTime(-5);
  }

  right5Seconds(): void {
    this.video.changeCurrentTime(5);
  }

  frameRewind(): void {
    this.frameAdvanceNum(-1);
  }

  frameAdvance(): void {
    this.frameAdvanceNum(1);
  }

  frameAdvanceNum(frames: number): void {
    if (this.video.video && this.video.framerate) {
      if (!this.video.video.paused) {
        this.video.video.pause();
      }

      this.video.changeCurrentTime(frames / this.video.framerate);
    }
  }

  keyDown(event: KeyboardEvent) {
    if (this.ignoreShortcuts) {
      return;
    }

    const matches = this.actions.get(event.code);

    if (matches) {
      for (const match of matches) {
        if ((!match.needsCtrl || (event.ctrlKey || event.metaKey)) &&
          (!match.needsShift || event.shiftKey)) {
          match.action();
          event.preventDefault();
          return;
        }
      }
    }
  }

  keyUp(event: KeyboardEvent) {

  }
}
