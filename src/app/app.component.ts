import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Link } from './link.model';
import { LinkService } from './link.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private readonly links = inject(LinkService);

  readonly title = 'snip-frontend';

  readonly url = signal('');
  readonly allLinks = signal<Link[]>([]);
  readonly created = signal<Link | null>(null);
  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);

  ngOnInit(): void {
    this.refresh();
  }

  submit(): void {
    const value = this.url().trim();
    this.created.set(null);
    this.error.set(null);

    if (!this.isHttpUrl(value)) {
      this.error.set('Enter a valid http:// or https:// URL.');
      return;
    }

    this.submitting.set(true);
    this.links.shorten(value).subscribe({
      next: (link) => {
        this.created.set(link);
        this.url.set('');
        this.submitting.set(false);
        this.refresh();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.describe(err));
        this.submitting.set(false);
      },
    });
  }

  refresh(): void {
    this.links.list().subscribe({
      next: (links) => this.allLinks.set(links),
      error: (err: HttpErrorResponse) => this.error.set(this.describe(err)),
    });
  }

  private isHttpUrl(value: string): boolean {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      return false;
    }
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  }

  private describe(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'Cannot reach the Snip API at http://localhost:3000 — is the backend running?';
    }
    return err.error?.error ?? `Request failed (HTTP ${err.status}).`;
  }
}
