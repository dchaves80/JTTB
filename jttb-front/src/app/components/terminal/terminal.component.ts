import { Component, ElementRef, ViewChild, AfterViewChecked, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { DbBuilderComponent } from '../db-builder/db-builder.component';

interface CommandResult {
  command: string;
  stdout: string;
  stderr: string;
  success: boolean;
  timestamp: Date;
  cwd?: string;
}

@Component({
  selector: 'app-terminal',
  standalone: true,
  imports: [CommonModule, FormsModule, DbBuilderComponent],
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.css'
})
export class TerminalComponent implements AfterViewChecked {
  @ViewChild('terminalOutput') terminalOutput!: ElementRef;
  @ViewChild('commandInput') commandInput!: ElementRef;
  @ViewChild('searchInput') searchInput!: ElementRef;

  currentCommand = '';
  history: CommandResult[] = [];
  commandHistory: string[] = [];
  historyIndex = -1;
  loading = false;
  user: string;
  cwd = '~'; // Directorio actual
  isDragging = false; // Estado de drag & drop

  // Search
  showSearch = false;
  searchTerm = '';
  currentMatch = 0;
  totalMatches = 0;
  matchingLines: { index: number; text: string; type: 'stdout' | 'stderr' }[] = [];

  // Favorites
  favorites: string[] = [];
  showFavorites = false;
  preventScroll = false;
  newFavorite = '';
  private lastScrollTime = 0;

  // DB Builder
  showDbBuilder = false;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    public authService: AuthService,
    public router: Router
  ) {
    this.user = this.authService.getUser() || 'user';
    this.loadFavorites();
  }

  // Favorites methods
  loadFavorites(): void {
    const saved = localStorage.getItem('jttb-favorites');
    if (saved) {
      this.favorites = JSON.parse(saved);
    }
  }

  saveFavorites(): void {
    localStorage.setItem('jttb-favorites', JSON.stringify(this.favorites));
  }

  addFavorite(command: string): void {
    if (command && !this.favorites.includes(command)) {
      this.favorites.push(command);
      this.saveFavorites();
    }
  }

  addNewFavorite(): void {
    const cmd = this.newFavorite.trim();
    if (cmd) {
      this.addFavorite(cmd);
      this.newFavorite = '';
    }
  }

  removeFavorite(command: string): void {
    this.favorites = this.favorites.filter(f => f !== command);
    this.saveFavorites();
  }

  isFavorite(command: string): boolean {
    return this.favorites.includes(command);
  }

  onFavoriteClick(event: Event, command: string): void {
    event.preventDefault();
    event.stopPropagation();

    // Capture scroll position BEFORE any changes
    const scrollTop = this.terminalOutput?.nativeElement?.scrollTop || 0;

    this.preventScroll = true;
    this.lastScrollTime = Date.now() + 5000; // Block scroll for 5 seconds

    if (this.isFavorite(command)) {
      this.removeFavorite(command);
    } else {
      this.addFavorite(command);
    }

    // Restore scroll position after Angular processes changes
    setTimeout(() => {
      if (this.terminalOutput?.nativeElement) {
        this.terminalOutput.nativeElement.scrollTop = scrollTop;
      }
    }, 0);

    setTimeout(() => {
      if (this.terminalOutput?.nativeElement) {
        this.terminalOutput.nativeElement.scrollTop = scrollTop;
      }
    }, 50);

    setTimeout(() => {
      if (this.terminalOutput?.nativeElement) {
        this.terminalOutput.nativeElement.scrollTop = scrollTop;
      }
      this.preventScroll = false;
    }, 200);
  }

  toggleFavorite(command: string): void {
    if (this.isFavorite(command)) {
      this.removeFavorite(command);
    } else {
      this.addFavorite(command);
    }
  }

  useFavorite(command: string): void {
    this.currentCommand = command;
    this.showFavorites = false;
    this.focusInput();
  }

  toggleFavoritesPanel(): void {
    this.showFavorites = !this.showFavorites;
    if (this.showFavorites) {
      this.showSearch = false;
    }
  }

  toggleDbBuilder(): void {
    this.showDbBuilder = !this.showDbBuilder;
    if (this.showDbBuilder) {
      this.showFavorites = false;
      this.showSearch = false;
    }
  }

  executeFromDbBuilder(command: string): void {
    this.currentCommand = command;
    this.showDbBuilder = false;
    this.executeCommand();
  }

  ngAfterViewChecked(): void {
    if (!this.preventScroll && !this.loading) {
      const now = Date.now();
      if (now - this.lastScrollTime > 100) {
        this.scrollToBottom();
        this.lastScrollTime = now;
      }
    }
  }

  executeCommand(): void {
    const cmd = this.currentCommand.trim();
    if (!cmd || this.loading) return;

    // Comandos locales
    if (cmd === 'clear') {
      this.history = [];
      this.currentCommand = '';
      return;
    }

    if (cmd === 'exit' || cmd === 'logout') {
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    if (cmd === 'help') {
      this.history.push({
        command: cmd,
        stdout: this.getHelpText(),
        stderr: '',
        success: true,
        timestamp: new Date(),
        cwd: this.shortCwd
      });
      this.currentCommand = '';
      this.commandHistory.push(cmd);
      return;
    }

    if (cmd === 'pwd') {
      this.history.push({
        command: cmd,
        stdout: this.cwd,
        stderr: '',
        success: true,
        timestamp: new Date(),
        cwd: this.shortCwd
      });
      this.currentCommand = '';
      this.commandHistory.push(cmd);
      return;
    }

    // Comando download
    const downloadMatch = cmd.match(/^download\s+(.+)$/i);
    if (downloadMatch) {
      const filePath = downloadMatch[1].trim().replace(/^["']|["']$/g, '');
      this.downloadFile(filePath, cmd);
      return;
    }

    this.loading = true;
    this.commandHistory.push(cmd);
    this.historyIndex = this.commandHistory.length;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`,
      'Content-Type': 'application/json'
    });

    const cwdToSend = this.cwd === '~' ? undefined : this.cwd;
    const cwdAtExec = this.shortCwd; // Guardar el cwd actual antes de ejecutar
    this.http.post<any>(`${environment.apiUrl}/api/exec`, { command: cmd, cwd: cwdToSend }, { headers }).subscribe({
      next: (result) => {
        this.history.push({
          command: cmd,
          stdout: result.stdout,
          stderr: result.stderr,
          success: result.success,
          timestamp: new Date(),
          cwd: cwdAtExec
        });
        // Actualizar directorio de trabajo
        if (result.cwd) {
          this.cwd = result.cwd;
        }
        this.loading = false;
        this.currentCommand = '';
        setTimeout(() => this.focusInput(), 0);
      },
      error: (err) => {
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
          return;
        }
        this.history.push({
          command: cmd,
          stdout: '',
          stderr: err.error?.error || 'Error de conexión',
          success: false,
          timestamp: new Date(),
          cwd: cwdAtExec
        });
        this.loading = false;
        this.currentCommand = '';
        setTimeout(() => this.focusInput(), 0);
      }
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.currentCommand = this.commandHistory[this.historyIndex];
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.historyIndex < this.commandHistory.length - 1) {
        this.historyIndex++;
        this.currentCommand = this.commandHistory[this.historyIndex];
      } else {
        this.historyIndex = this.commandHistory.length;
        this.currentCommand = '';
      }
    }
  }

  scrollToBottom(): void {
    if (this.terminalOutput) {
      this.terminalOutput.nativeElement.scrollTop = this.terminalOutput.nativeElement.scrollHeight;
    }
  }

  focusInput(): void {
    if (this.commandInput) {
      this.commandInput.nativeElement.focus();
    }
  }

  onContainerClick(event: Event): void {
    const target = event.target as HTMLElement;
    // Don't focus input if clicking on favorite button or toolbar
    if (target.closest('.favorite-btn') || target.closest('.toolbar-btn') || target.closest('.favorites-panel')) {
      return;
    }
    this.focusInput();
  }

  // Acortar el path para el prompt
  get shortCwd(): string {
    if (this.cwd === '~') return '~';
    // Mostrar solo el último directorio o los últimos 30 chars
    const parts = this.cwd.replace(/\\/g, '/').split('/');
    if (parts.length <= 2) return this.cwd;
    return '.../' + parts.slice(-2).join('/');
  }

  // Descargar archivo
  downloadFile(filePath: string, cmd: string): void {
    this.commandHistory.push(cmd);
    const cwdAtExec = this.shortCwd;
    const cwdToSend = this.cwd === '~' ? '' : this.cwd;
    const token = this.authService.getToken();

    const url = `${environment.apiUrl}/api/download?path=${encodeURIComponent(filePath)}&cwd=${encodeURIComponent(cwdToSend)}`;

    // Usar fetch para manejar errores
    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.error || 'Error al descargar'); });
      }
      return response.blob().then(blob => ({
        blob,
        filename: this.getFilenameFromResponse(response) || filePath.split(/[\\/]/).pop() || 'download'
      }));
    })
    .then(({ blob, filename }) => {
      // Crear link y descargar
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);

      this.history.push({
        command: cmd,
        stdout: `Descargando: ${filename}`,
        stderr: '',
        success: true,
        timestamp: new Date(),
        cwd: cwdAtExec
      });
      this.currentCommand = '';
    })
    .catch(error => {
      this.history.push({
        command: cmd,
        stdout: '',
        stderr: error.message,
        success: false,
        timestamp: new Date(),
        cwd: cwdAtExec
      });
      this.currentCommand = '';
    });
  }

  getFilenameFromResponse(response: Response): string | null {
    const disposition = response.headers.get('Content-Disposition');
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match) return match[1];
    }
    return null;
  }

  getHelpText(): string {
    return `
JTTB - Terminal Toolbox
=======================

Comandos locales:
  help            - Muestra esta ayuda
  clear           - Limpia la terminal
  pwd             - Muestra directorio actual
  cd <dir>        - Cambia de directorio
  download <file> - Descarga un archivo
  exit            - Cierra la sesión

Upload:
  Arrastra archivos a la terminal para subirlos al directorio actual

Comandos de red:
  nslookup <host>              - Resolver DNS
  nc -zv <host> <port>         - Test TCP
  curl <url>                   - HTTP request

Bases de datos:
  psql -h <host> -U <user> -d <db> -c "<query>"
  mongosh <host>:<port>
  tsql -H <host> -p <port> -U <user>

Ejemplos (formato K8s: servicio.namespace):
  nslookup postgres.databases
  nc -zv redis.cache 6379
  curl http://api.backend:3000/health

Mas ayuda: cat /help.txt
`;
  }

  // Drag & Drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFile(files[0]);
    }
  }

  uploadFile(file: File): void {
    const cwdToSend = this.cwd === '~' ? '' : this.cwd;
    const cwdAtExec = this.shortCwd;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('cwd', cwdToSend);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    this.history.push({
      command: `upload ${file.name}`,
      stdout: 'Subiendo archivo...',
      stderr: '',
      success: true,
      timestamp: new Date(),
      cwd: cwdAtExec
    });

    this.http.post<any>(`${environment.apiUrl}/api/upload`, formData, { headers }).subscribe({
      next: (result) => {
        // Actualizar el último mensaje del historial
        const lastItem = this.history[this.history.length - 1];
        lastItem.stdout = `Archivo subido: ${result.path} (${this.formatSize(result.size)})`;
        lastItem.success = true;
      },
      error: (err) => {
        const lastItem = this.history[this.history.length - 1];
        lastItem.stdout = '';
        lastItem.stderr = err.error?.error || 'Error al subir archivo';
        lastItem.success = false;
      }
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // Search functionality
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
      event.preventDefault();
      this.toggleSearch();
    }
  }

  toggleSearch(): void {
    this.showSearch = !this.showSearch;
    if (this.showSearch) {
      setTimeout(() => this.searchInput?.nativeElement?.focus(), 0);
    } else {
      this.searchTerm = '';
      this.currentMatch = 0;
      this.totalMatches = 0;
      this.focusInput();
    }
  }

  onSearch(): void {
    if (!this.searchTerm) {
      this.totalMatches = 0;
      this.matchingLines = [];
      return;
    }
    this.findMatches();
  }

  findMatches(): void {
    const term = this.searchTerm.toLowerCase();
    this.matchingLines = [];
    let count = 0;

    for (let i = 0; i < this.history.length; i++) {
      const item = this.history[i];
      if (item.stdout && item.stdout.toLowerCase().includes(term)) {
        const lines = item.stdout.split('\n').filter(line => line.toLowerCase().includes(term));
        for (const line of lines) {
          this.matchingLines.push({ index: i, text: line.trim().substring(0, 80), type: 'stdout' });
          count++;
        }
      }
      if (item.stderr && item.stderr.toLowerCase().includes(term)) {
        const lines = item.stderr.split('\n').filter(line => line.toLowerCase().includes(term));
        for (const line of lines) {
          this.matchingLines.push({ index: i, text: line.trim().substring(0, 80), type: 'stderr' });
          count++;
        }
      }
    }
    this.totalMatches = count;
  }

  scrollToHistoryItem(index: number): void {
    setTimeout(() => {
      const container = this.terminalOutput.nativeElement;
      const blocks = container.querySelectorAll('.command-block');
      const target = blocks[index] as HTMLElement;
      if (target && container) {
        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        container.scrollTop = container.scrollTop + (targetRect.top - containerRect.top) - 50;
      }
    }, 50);
  }

  highlightText(text: string): SafeHtml {
    if (!this.searchTerm || !text) {
      return this.sanitizer.bypassSecurityTrustHtml(this.escapeHtml(text));
    }

    const escaped = this.escapeHtml(text);
    const term = this.escapeHtml(this.searchTerm);
    const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');

    const highlighted = escaped.replace(regex, (match) => {
      this.globalMatchIndex++;
      const isCurrent = this.globalMatchIndex === this.currentMatch;
      return `<span class="search-highlight${isCurrent ? ' current' : ''}">${match}</span>`;
    });
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  // Reset global match index before each render cycle
  private globalMatchIndex = 0;

  resetMatchIndex(): string {
    this.globalMatchIndex = 0;
    return '';
  }

  escapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
