import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) { }

  // 1. Iniciar Sesión: Envía credenciales al backend real
  login(usuario: string, clave: string): Observable<any> {
    const body = { username: usuario, password: clave };
    return this.http.post(`${this.apiUrl}/login`, body);
  }

  // 2. Guardar Sesión: Limpia basura y guarda los datos de Juan/Carlos
  guardarSesion(token: string, usuario: any) {
    localStorage.clear(); // Elimina cualquier rastro de sesiones anteriores (como el Admin)
    localStorage.setItem('token', token);
    
    // Guardamos el objeto usuario (id, nombre, rol) como texto
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }

  // 3. Cerrar Sesión: Limpieza total y preparación para el redirect
  logout() {
    localStorage.clear(); // Borra token y datos del usuario
    sessionStorage.clear(); // Por si acaso usaste session storage en algún lado
  }

  // 4. Obtener Usuario: Recupera el objeto real desde el LocalStorage
  getUsuario(): any {
    const u = localStorage.getItem('usuario');
    return u ? JSON.parse(u) : null;
  }

  // 5. Obtener Rol: Útil para mostrar/ocultar botones en el HTML
  getRol(): string {
    const user = this.getUsuario();
    return user ? (user.rol || user.nombre_rol || '') : '';
  }

  // 6. Verificar si está logueado
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
}