import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TdrService {
  // ⚠️ Asegúrate que este puerto (3000) sea el correcto de tu backend
  private apiUrl = 'http://localhost:3000/api/tdrs'; 

  constructor(private http: HttpClient) { }

  getTdrs(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getTdrById(id: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createTdr(data: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post(this.apiUrl, data, { headers });
  }

  updateTdr(id: any, data: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    });
    return this.http.put(`${this.apiUrl}/${id}`, data, { headers });
  }

  deleteTdr(id: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }

  // --- ESTA ES LA FUNCIÓN QUE TE FALTABA ---
  subirArchivoTdr(data: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    // Ajusta '/subir-archivo' si tu backend usa otra ruta (ej: '/upload')
    return this.http.post(`${this.apiUrl}/subir-archivo`, data, { headers });
  }
}