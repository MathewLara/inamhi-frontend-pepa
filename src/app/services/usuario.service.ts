import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://localhost:3000/api/usuarios';

  constructor(private http: HttpClient) { }

  // Helper para enviar el Token en cada petición
  private getHeaders() {
    const token = localStorage.getItem('token');
    return { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) };
  }

  getUsuarios(): Observable<any> {
    return this.http.get(this.apiUrl, this.getHeaders());
  }

  crearUsuario(usuario: any): Observable<any> {
    return this.http.post(this.apiUrl, usuario, this.getHeaders());
  }

  cambiarPassword(idUsuario: number, nuevaClave: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${idUsuario}/password`, { nuevaPassword: nuevaClave }, this.getHeaders());
  }
  
  eliminarUsuario(id: number): Observable<any> {
      return this.http.delete(`${this.apiUrl}/${id}`, this.getHeaders());
  }
}