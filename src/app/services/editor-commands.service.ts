import { Injectable, EventEmitter } from '@angular/core';
import { EditorCommand } from './editor-commands/editor-command';
import { FieldService } from './field.service';

@Injectable({
  providedIn: 'root'
})
export class EditorCommandsService {

  undoStack: EditorCommand[] = [];
  redoStack: EditorCommand[] = [];
  commandRun: EventEmitter<void>;

  get hasUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get hasRedo(): boolean {
    return this.redoStack.length > 0;
  }

  constructor(private field: FieldService) {
    this.commandRun = new EventEmitter();
  }

  runCommand(command: EditorCommand): void {
    const commit = command.apply(this.field.data);
    this.undoStack.push(command);

    if (this.redoStack.length > 0) {
      this.redoStack = [];
    }

    if (commit) {
      this.field.updateField();

      this.commandRun.emit();
    }
  }

  undo(): boolean {
    if (this.hasUndo) {
      const undoCommand = this.undoStack.pop() as EditorCommand;
      this.redoStack.push(undoCommand);
      if (undoCommand.revert(this.field.data)) {
        this.field.updateField();

        this.commandRun.emit();
      }

      return true;
    }

    return false;
  }

  redo(): boolean {
    if (this.hasRedo) {
      const redoCommand = this.redoStack.pop() as EditorCommand;
      this.undoStack.push(redoCommand);
      if (redoCommand.apply(this.field.data)) {
        this.field.updateField();

        this.commandRun.emit();
      }

      return true;
    }

    return false;
  }
}
