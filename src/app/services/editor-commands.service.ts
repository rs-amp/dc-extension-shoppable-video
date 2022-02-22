import { Injectable } from '@angular/core';
import { EditorCommand } from './editor-commands/editor-command';
import { FieldService } from './field.service';

@Injectable({
  providedIn: 'root'
})
export class EditorCommandsService {

  undoQueue: EditorCommand[] = [];
  redoQueue: EditorCommand[] = [];

  get hasUndo(): boolean {
    return this.undoQueue.length > 0;
  }

  constructor(private field: FieldService) { }

  runCommand(command: EditorCommand): void {
    const commit = command.apply(this.field.data);
    this.undoQueue.push(command);

    if (this.redoQueue.length > 0) {
      this.redoQueue = [];
    }

    if (commit) {
      this.field.updateField();
    }
  }

  undo(): boolean {
    if (this.hasUndo) {
      this.redoQueue.push(this.undoQueue[0]);
      this.undoQueue[0].revert(this.field.data);
      this.undoQueue.splice(0, 1);

      return true;
    }

    return false;
  }
}
