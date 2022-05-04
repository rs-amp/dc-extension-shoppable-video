import { EventEmitter, Injectable } from '@angular/core';

const localStorageName = 'uiex-shoppable-video-theme'

interface Theme {
  name: string;
  href: string;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  themes: Theme[] = [
    {
      name: 'light',
      href: 'theme-light.css',
    },
    {
      name: 'dark',
      href: 'theme-dark.css',
    },
  ];

  activeTheme?: string;
  switchingTheme = false;
  changed: EventEmitter<string>;

  constructor() {
    this.changed = new EventEmitter();

    this.setTheme(this.getLocalStorageTheme(), false);
  }

  private getLocalStorageTheme(): string {
    try {
      return localStorage.getItem(localStorageName) || 'light';
    } catch {
      console.error('Could not get chosen theme from localStorage. Make sure the extension has Allow Same Origin permissions.');
      return 'light';
    }
  }

  private setLocalStorageTheme(value: string) {
    try {
      return localStorage.setItem(localStorageName, value);
    } catch {
      // Silently fail if the theme cannot be saved.
    }
  }

  private getLinkElement(name: string): Element | null {
    return document.head.querySelector(
      `link[rel="stylesheet"].app-theme--${name}`
    );
  }

  private createLinkElement(name: string) {
    const elem = document.createElement('link');
    elem.setAttribute('rel', 'stylesheet');
    elem.className = `app-theme--${name}`;
    document.head.appendChild(elem);
    return elem;
  }

  private async setStyle(name: string, href: string) {
    const elem = this.getLinkElement(name) || this.createLinkElement(name);

    const linkPromise = new Promise((resolve, reject) => {
      (elem as HTMLLinkElement).onload = resolve;
      (elem as HTMLLinkElement).onerror = resolve;
      elem.setAttribute('href', href);
    });

    await linkPromise;
  }

  private removeStyle(name: string) {
    const elem = this.getLinkElement(name);
    if (elem) {
      document.head.removeChild(elem);
    }
  }

  async setTheme(name: string, save = true) {
    if (this.switchingTheme) return;

    const theme = this.themes.find(t => t.name === name);

    if (theme == null) return;

    this.setLocalStorageTheme(name);

    this.switchingTheme = true;
    await this.setStyle(name, theme.href);

    if (this.activeTheme != null) {
      this.removeStyle(this.activeTheme);
    }

    this.activeTheme = name;

    this.changed.emit(this.activeTheme);
    this.switchingTheme = false;
  }
}
