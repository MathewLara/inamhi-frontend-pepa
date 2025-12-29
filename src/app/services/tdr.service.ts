import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TdrService {
  private apiUrl = 'http://localhost:3000/api/tdrs'; 
  // Esta URL es para borrar archivos (usa tu archivoRoutes)
  private archivosUrl = 'http://localhost:3000/api/archivos'; 

  constructor(private http: HttpClient) { }

  getTdrs(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getTdrById(id: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createTdr(data: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}` 
    });
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

  // --- FUNCIÓN PARA BORRAR ARCHIVOS (Punto 2.1) ---
  deleteArchivo(idArchivo: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.delete(`${this.archivosUrl}/${idArchivo}`, { headers });
  }
}