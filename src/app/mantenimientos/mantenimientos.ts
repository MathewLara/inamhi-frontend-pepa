import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MantenimientoService } from '../services/mantenimiento.service';
import { TdrService } from '../services/tdr.service';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-mantenimientos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mantenimientos.html',
  styleUrls: ['./mantenimientos.css'] 
})
export class MantenimientosComponent implements OnInit {

  listaMantenimientos: any[] = [];
  listaTdrs: any[] = [];
  mostrarModalReporte: boolean = false;
  
  nuevoReporte: any = {
    id_tdr: '', // Vinculación
    nombre_equipo: '',
    descripcion_fallo: '',
    fecha_reporte: new Date().toISOString().split('T')[0],
    tecnico_sugerido: '',
    id_usuario_reporta: 0
  };

  archivoInforme: File | null = null;
  rolUsuario: string = '';

  constructor(
    private mantService: MantenimientoService,
    private tdrService: TdrService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      const usuario = JSON.parse(usuarioGuardado);
      this.nuevoReporte.id_usuario_reporta = usuario.id || usuario.id_usuario;
      this.rolUsuario = usuario.rol || '';
    }
    this.cargarMantenimientos();
    this.cargarTdrs();
  }

  cargarMantenimientos() {
    this.mantService.getMantenimientos().subscribe(data => {
      this.listaMantenimientos = data;
      this.cd.detectChanges();
    });
  }

  cargarTdrs() {
    this.tdrService.getTdrs().subscribe(data => {
      this.listaTdrs = data.filter(t => t.estado !== 'FINALIZADO');
    });
  }

  // ==========================================
  // 🖨️ FUNCIÓN EXPORTAR PDF
  // ==========================================
  exportarPDF() {
    const doc = new jsPDF();
    doc.setFillColor(0, 51, 102);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('REPORTE DE MANTENIMIENTOS Y SOPORTES', 14, 13);

    const head = [['Equipo', 'Fallo', 'Fecha', 'Técnico', 'Estado']];
    const data = this.listaMantenimientos.map(m => [
      m.nombre_equipo,
      m.descripcion_fallo,
      new Date(m.fecha_reporte).toLocaleDateString(),
      m.tecnico_asignado || 'Sin asignar',
      m.estado
    ]);

    autoTable(doc, { startY: 30, head: head, body: data, theme: 'striped' });
    doc.save('Reporte_Mantenimientos.pdf');
  }

  abrirModalReporte() {
    this.limpiarFormulario();
    this.mostrarModalReporte = true;
  }
  
  cerrarModalReporte() { this.mostrarModalReporte = false; }

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
        this.archivoInforme = event.target.files[0];
    }
  }

  guardarReporte() {
    if (!this.nuevoReporte.nombre_equipo || !this.nuevoReporte.descripcion_fallo || !this.nuevoReporte.id_tdr) {
      Swal.fire('Atención', 'Selecciona el TDR y completa los datos del equipo.', 'warning');
      return;
    }

    this.mantService.createMantenimiento(this.nuevoReporte).subscribe({
      next: (res: any) => {
        // Subir archivo si existe
        if (this.archivoInforme && res.id_mantenimiento) {
            this.mantService.subirInforme(res.id_mantenimiento, this.archivoInforme).subscribe({
                next: () => {
                    Swal.fire('Éxito', 'Reporte e informe guardados', 'success');
                    this.cerrarModalReporte();
                    this.cargarMantenimientos();
                },
                error: () => Swal.fire('Aviso', 'Reporte creado, pero falló la subida del PDF', 'warning')
            });
        } else {
            Swal.fire('Éxito', 'Reporte creado correctamente', 'success');
            this.cerrarModalReporte();
            this.cargarMantenimientos();
        }
      },
      error: () => Swal.fire('Error', 'No se pudo crear el reporte', 'error')
    });
  }

  limpiarFormulario() {
    this.nuevoReporte = {
      id_tdr: '',
      nombre_equipo: '',
      descripcion_fallo: '',
      fecha_reporte: new Date().toISOString().split('T')[0],
      tecnico_sugerido: '',
      id_usuario_reporta: this.nuevoReporte.id_usuario_reporta
    };
    this.archivoInforme = null;
  }

  cambiarEstado(mantenimiento: any, nuevoEstado: string) {
      this.mantService.updateEstado(mantenimiento.id_mantenimiento, nuevoEstado).subscribe(() => {
          this.cargarMantenimientos();
      });
  }
}