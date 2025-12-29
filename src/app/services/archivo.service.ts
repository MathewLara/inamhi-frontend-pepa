import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArchivoService {
  // Asegúrate de que este puerto coincida con tu backend (3000)
  private apiUrl = 'http://localhost:3000/api/archivos'; 

  constructor(private http: HttpClient) { }

  subirArchivoTdr(archivo: File, idTdr: number): Observable<any> {
    const formData = new FormData();
    
    // 'miArchivo' debe coincidir EXACTO con lo que pusimos en el Backend (multer)
    formData.append('miArchivo', archivo); 
    formData.append('id_tdr', idTdr.toString());
    formData.append('tipo_documento', '1'); // 1 = Informe de Necesidad (Ejemplo)
    
    // Enviamos un ID de usuario por defecto (o podrías sacarlo del localStorage)
    const idUsuario = localStorage.getItem('id_usuario') || '1';
    formData.append('id_usuario', idUsuario);

    return this.http.post(`${this.apiUrl}/upload`, formData);
  }
}