import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private apiUrl = 'http://localhost:3000/api/auditoria';

  constructor(private http: HttpClient) { }

  getAuditoria(filtros: any): Observable<any> {
    let params = new HttpParams();
    
    // Configuración de parámetros
    if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
    if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
    if (filtros.busqueda === 'ELIMINAR') params = params.set('mostrarEliminados', 'true');

    // Configuración de Token (Seguridad)
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Enviamos params y headers
    return this.http.get<any>(this.apiUrl, { params, headers });
  }
}