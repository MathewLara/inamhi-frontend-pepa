import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MantenimientoService {
  
  // Ruta base de la API
  private apiUrl = 'http://localhost:3000/api/mantenimientos'; 

  constructor(private http: HttpClient) { }

  // 1. Obtener lista
  getMantenimientos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // 2. Crear nuevo reporte
  createMantenimiento(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  // 3. Actualizar estado (Pendiente -> En Proceso -> Finalizado)
  updateEstado(id: number, nuevoEstado: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/estado`, { nuevoEstado });
  }

  // 4. NUEVA FUNCIÓN: Subir PDF (Informe)
  subirInforme(id: number, archivo: File): Observable<any> {
    const formData = new FormData();
    // 'informe' debe coincidir con lo que espera tu backend en upload.single('informe')
    formData.append('informe', archivo); 

    // Envía el archivo a la ruta: /api/mantenimientos/123/informe
    return this.http.post(`${this.apiUrl}/${id}/informe`, formData);
  }
  
}