import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Link } from './link.model';

const API_BASE = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class LinkService {
  private readonly http = inject(HttpClient);

  list(): Observable<Link[]> {
    return this.http.get<Link[]>(`${API_BASE}/api/links`);
  }

  shorten(url: string): Observable<Link> {
    return this.http.post<Link>(`${API_BASE}/api/links`, { url });
  }
}
