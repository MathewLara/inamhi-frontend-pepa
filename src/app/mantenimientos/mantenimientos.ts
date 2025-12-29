import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MantenimientoService } from '../services/mantenimiento.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-mantenimientos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mantenimientos.html', // Asegúrate que el nombre coincida (html o component.html)
  styleUrls: ['./mantenimientos.css']   // Asegúrate que el nombre coincida (css o component.css)
})
export class MantenimientosComponent implements OnInit {

  listaMantenimientos: any[] = [];
  mostrarModalReporte: boolean = false;

  nuevoReporte = {
    nombre_equipo: '',
    descripcion_fallo: '',
    fecha_reporte: new Date().toISOString().split('T')[0], 
    tecnico_sugerido: '',
    id_usuario_reporta: 0 
  };

  rolUsuario: string = '';

  constructor(
    private mantenimientoService: MantenimientoService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // 1. Cargar Usuario
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      const usuario = JSON.parse(usuarioGuardado);
      this.nuevoReporte.id_usuario_reporta = usuario.id_usuario;
      this.rolUsuario = usuario.rol;
    }

    // 2. Cargar datos
    this.cargarMantenimientos();
  }

  cargarMantenimientos() {
    this.mantenimientoService.getMantenimientos().subscribe({
      next: (data: any) => {
        console.log("📥 Datos recibidos:", data);
        // Ordenamos por fecha (el más reciente primero)
        this.listaMantenimientos = (data || []).sort((a: any, b: any) => 
          new Date(b.fecha_reporte).getTime() - new Date(a.fecha_reporte).getTime()
        );
        this.cd.detectChanges();
      },
      error: (error: any) => {
        console.error('🔥 Error al cargar:', error);
      }
    });
  }

  // --- NUEVO: LÓGICA PARA EL BOTÓN VER ---
  verDetalle(item: any) {
    Swal.fire({
      title: `🛠️ Soporte: ${item.nombre_equipo || item.equipo || 'Equipo'}`,
      html: `
        <div style="text-align: left; font-size: 0.95rem;">
          <p><strong>📅 Fecha Reporte:</strong> ${item.fecha_reporte ? new Date(item.fecha_reporte).toLocaleDateString() : 'N/A'}</p>
          <p><strong>⚠️ Fallo:</strong> ${item.descripcion_fallo || item.fallo || 'Sin descripción'}</p>
          <p><strong>👤 Técnico Sugerido:</strong> ${item.tecnico_sugerido || 'No especificado'}</p>
          <hr>
          <p><strong>📊 Estado Actual:</strong> 
             <span style="color:${this.getColorTexto(item.estado)}; font-weight:bold">
               ${item.estado || 'PENDIENTE'}
             </span>
          </p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#003366'
    });
  }

  // --- NUEVO: AYUDA VISUAL PARA EL HTML ---
  // Retorna la clase CSS para el badge (etiqueta) según el estado
  getBadgeClass(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'FINALIZADO': return 'bg-success';      // Verde
      case 'EN PROCESO': return 'bg-info text-dark'; // Azul claro
      default: return 'bg-warning text-dark';      // Amarillo (Pendiente)
    }
  }

  // Auxiliar para el color del texto dentro del SweetAlert
  private getColorTexto(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'FINALIZADO': return 'green';
      case 'EN PROCESO': return '#17a2b8';
      default: return '#ffc107'; // Amarillo oscuro
    }
  }

  // --- FUNCIONES DEL MODAL Y REGISTRO ---

  abrirModalReporte() {
    this.mostrarModalReporte = true;
  }

  cerrarModalReporte() {
    this.mostrarModalReporte = false;
  }

  registrarReporte() {
    if (!this.nuevoReporte.nombre_equipo || !this.nuevoReporte.descripcion_fallo) {
      Swal.fire({
        title: 'Faltan datos',
        text: 'Por favor completa el nombre del equipo y la descripción.',
        icon: 'warning',
        confirmButtonColor: '#003366'
      });
      return;
    }

    // Asegurar ID de usuario
    if (this.nuevoReporte.id_usuario_reporta === 0) {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            this.nuevoReporte.id_usuario_reporta = JSON.parse(usuarioGuardado).id_usuario;
        } else {
            this.nuevoReporte.id_usuario_reporta = 1; 
        }
    }

    this.mantenimientoService.createMantenimiento(this.nuevoReporte).subscribe({
      next: (resp: any) => {
        Swal.fire('¡Reporte Enviado!', 'Se ha registrado correctamente.', 'success');
        this.cerrarModalReporte();
        this.cargarMantenimientos();
        this.limpiarFormulario();
      },
      error: (error: any) => {
        console.error('Error al guardar:', error);
        Swal.fire('Error', 'No se pudo guardar.', 'error');
      }
    });
  }

  limpiarFormulario() {
    this.nuevoReporte = {
      nombre_equipo: '',
      descripcion_fallo: '',
      fecha_reporte: new Date().toISOString().split('T')[0],
      tecnico_sugerido: '',
      id_usuario_reporta: this.nuevoReporte.id_usuario_reporta
    };
  }

  cambiarEstado(mantenimiento: any, nuevoEstado: string) {
    Swal.fire({
      title: '¿Actualizar estado?',
      text: `Pasará a: ${nuevoEstado}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#003366',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, actualizar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.mantenimientoService.updateEstado(mantenimiento.id_mantenimiento, nuevoEstado).subscribe({
          next: () => {
            this.cargarMantenimientos();
            const Toast = Swal.mixin({
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000
            });
            Toast.fire({ icon: 'success', title: 'Estado actualizado' });
          },
          error: (error: any) => {
             console.error(error);
             Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
          }
        });
      }
    });
  }
}