import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContratoService {

  // OJO: Asegúrate de que sea el puerto 3000 (Tu backend de Node.js)
  private apiUrl = 'http://localhost:3000/api/contratos'; 

  constructor(private http: HttpClient) {}

  // 1. OBTENER TODOS (Para la tabla)
  getContratos(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // 2. OBTENER CATALOGOS (Para llenar los selects de Áreas y Supervisores)
  getCatalogos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/catalogos`);
  }

  // 3. OBTENER UN SOLO CONTRATO POR ID (Para llenar el formulario al Editar)
  getContratoById(id: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // 4. CREAR NUEVO CONTRATO
  createContrato(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // 5. ACTUALIZAR CONTRATO EXISTENTE (PUT)
  updateContrato(id: any, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // 6. ELIMINAR CONTRATO
  deleteContrato(id: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // 7. SUBIR ARCHIVO PDF (AÑADIDO PARA EXPEDIENTE DIGITAL)
  // Este método permite enviar el PDF y vincularlo cronológicamente al contrato 
  subirArchivoContrato(formData: FormData): Observable<any> {
    // Apunta a la ruta de carga de archivos en tu backend
    return this.http.post(`${this.apiUrl}/subir-archivo`, formData);
  }
}