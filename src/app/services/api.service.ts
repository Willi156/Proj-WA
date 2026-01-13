
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // Endpoint di test che abbiamo nel backend: /api/test
  getServerTime() {
    return this.http.get<{ serverTime: { now: string } }>(`${this.baseUrl}/api/test`);
  }

  // Esempio per futuri endpoint:
  // getItems() { return this.http.get<Item[]>(`${this.baseUrl}/api/items`); }
  // createItem(payload: ItemCreateDto) { return this.http.post(`${this.baseUrl}/api/items`, payload); }
}
