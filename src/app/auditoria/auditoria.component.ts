import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'; // Importamos HttpParams también
import { AuditoriaService } from '../services/auditoria.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auditoria.component.html',
  styleUrls: ['./auditoria.component.css']
})
export class AuditoriaComponent implements OnInit {

  filtros = {
    busqueda: '',
    fechaInicio: '',
    fechaFin: ''
  };

  logs: any[] = [];
  cargando: boolean = false;
  
  // URL directa al backend (Ajusta si tu puerto o ruta cambia)
  private apiUrl = 'http://localhost:3000/api/auditoria';

  constructor(
    private http: HttpClient,           // <--- 1. Cliente HTTP Directo
    private cd: ChangeDetectorRef,      // <--- 2. Detector de Cambios
    private auditoriaService: AuditoriaService // Lo dejamos por si acaso
  ) {}

  ngOnInit(): void {
    this.buscar(); // <--- 3. Se ejecuta al iniciar
  }

  buscar() {
    this.cargando = true;

    // A. OBTENER TOKEN
    const token = localStorage.getItem('token');
    if (!token) {
        this.cargando = false;
        return;
    }

    // B. PREPARAR HEADERS
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // C. PREPARAR PARÁMETROS (FILTROS)
    // Convertimos el objeto filtros a HttpParams para que la URL sea correcta
    let params = new HttpParams();
    if (this.filtros.busqueda) params = params.set('busqueda', this.filtros.busqueda);
    if (this.filtros.fechaInicio) params = params.set('fechaInicio', this.filtros.fechaInicio);
    if (this.filtros.fechaFin) params = params.set('fechaFin', this.filtros.fechaFin);

    // D. PETICIÓN DIRECTA
    this.http.get<any>(this.apiUrl, { headers, params }).subscribe({
      next: (resp) => {
        this.cargando = false;
        
        // Verificamos si la respuesta viene en 'resp.data' o directo en 'resp'
        const listaEventos = resp.data || resp; 

        // E. MAPEO DE DATOS (Tu lógica original)
        this.logs = listaEventos.map((item: any) => ({
          fecha_registro: item.fecha_evento,
          modulo: item.tabla_afectada,
          usuario: item.username,      
          accion: item.accion,
          detalle: this.generarDetalleLegible(item) 
        }));

        // F. FORZAR ACTUALIZACIÓN VISUAL
        this.cd.detectChanges(); 
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error loading audit:', err);
        // Opcional: No mostrar alerta intrusiva al inicio si solo está vacía
        if (err.status !== 404) {
             Swal.fire('Error', 'No se pudieron cargar los registros', 'error');
        }
      }
    });
  }

  // --- TU LÓGICA ORIGINAL (INTACTA) ---

  getBadgeClass(accion: string): string {
    switch (accion?.toUpperCase()) {
      case 'CREAR': return 'badge-crear';
      case 'ACTUALIZAR': return 'badge-editar';
      case 'ELIMINAR': return 'badge-eliminar';
      default: return 'badge-default';
    }
  }

  private generarDetalleLegible(item: any): string {
    const datos = item.accion === 'ELIMINAR' ? item.datos_anteriores : item.datos_nuevos;
    
    if (!datos) return 'Sin detalles registrados';

    // CASO A: TDR
    if (datos.numero_tdr) {
        return `${datos.numero_tdr} - ${datos.objeto_contratacion || ''}`;
    }
    // CASO B: Contrato
    if (datos.numero_contrato) {
        return `${datos.numero_contrato} (${datos.nombre_profesional || 'Sin nombre'})`;
    }
    // CASO C: Mantenimiento
    if (datos.equipo || datos.nombre_equipo) {
        const eq = datos.equipo || datos.nombre_equipo;
        const fl = datos.fallo || datos.descripcion_fallo;
        return `Soporte a ${eq}: "${fl}"`;
    }
    // CASO D: Usuario
    if (datos.username) {
        return `Usuario: ${datos.username} (${datos.nombre_rol || 'Rol actualizado'})`;
    }
    // CASO E: Fallback
    return 'Registro #' + (item.id_registro_afectado || '?');
  }
}