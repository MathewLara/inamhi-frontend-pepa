import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { TdrService } from '../services/tdr.service'; 
import Swal from 'sweetalert2';

// --- IMPORTACIONES PARA PDF ---
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-tdr-lista',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], 
  templateUrl: './tdr-lista.html',
  styleUrls: ['./tdr-lista.css']
})
export class TdrListaComponent implements OnInit {

  // VARIABLES DE DATOS
  tdrs: any[] = [];
  cargando: boolean = true; 
  esAdmin: boolean = false; 

  // VARIABLES MODAL NUEVO / EDITAR
  mostrarModal: boolean = false;
  esEdicion: boolean = false; 
  idTdrEditar: any = null;    
  
  mostrarOtraDireccion: boolean = false;
  otraDireccionTexto: string = '';
  
  nuevoTdr: any = {
    numero_tdr: '', tipo_proceso: 'Ínfima Cuantía', objeto_contratacion: '',
    direccion_solicitante: '', presupuesto: 0, responsable_designado: '',
    periodo_contrato: '', fecha_inicio: '', fecha_fin: '', estado: 'BORRADOR'
  };

  // VARIABLES MODAL VER / ARCHIVOS
  mostrarModalVer: boolean = false;
  tdrSeleccionado: any = null;
  archivoCapturado: File | null = null; 

  constructor(
    private tdrService: TdrService, 
    private http: HttpClient, 
    private router: Router,
    private cd: ChangeDetectorRef 
  ) { }

  ngOnInit(): void {
    this.verificarRol();
    this.obtenerTdrs();
  }

  // --- CARGA DE DATOS ---
  obtenerTdrs() {
    this.cargando = true;
    this.tdrService.getTdrs().subscribe({
      next: (data: any) => {
        this.tdrs = data || []; 
        this.cargando = false;
        this.cd.detectChanges(); 
      },
      error: () => this.cargando = false
    });
  }

  // --- ROL ADMIN VS TECNICO ---
  verificarRol() {
    const data = localStorage.getItem('usuario');
    if (data) {
      try {
        const user = JSON.parse(data);
        const rol = (user.rol || user.nombre_rol || '').toLowerCase().trim();
        if (rol === 'administrador del sistema' || rol === 'admin') {
            this.esAdmin = true;
        } else {
            this.esAdmin = false;
        }
      } catch (e) { this.esAdmin = false; }
    }
  }

  // ==========================================
  // 🖨️ FUNCIONES DE IMPRESIÓN PDF (NUEVO)
  // ==========================================

  // 1. REPORTE GENERAL (TABLA COMPLETA)
  exportarReporteGeneral() {
    const doc = new jsPDF();

    // Encabezado
    doc.setFillColor(0, 51, 102); // Azul INAMHI
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('REPORTE CONSOLIDADO DE TDRs - INAMHI', 14, 13);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 28);
    doc.text(`Total Registros: ${this.tdrs.length}`, 160, 28);

    // Columnas
    const head = [['Código', 'Objeto Contratación', 'Dirección', 'Presupuesto', 'Estado']];
    
    // Datos
    const data = this.tdrs.map(t => [
      t.numero_tdr,
      t.objeto_contratacion,
      t.nombre_direccion || t.direccion_solicitante || 'N/A',
      `$${Number(t.presupuesto_referencial || 0).toFixed(2)}`,
      t.estado || 'BORRADOR'
    ]);

    // Generar Tabla
    autoTable(doc, {
      startY: 35,
      head: head,
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102] },
      styles: { fontSize: 8 }
    });

    // Pie de página
    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text('Sistema de Gestión Integral INAMHI', 14, 285);
        doc.text(`Pág ${i}`, 190, 285);
    }

    doc.save('Reporte_General_TDRs.pdf');
  }

  // 2. FICHA TÉCNICA INDIVIDUAL
  imprimirFicha() {
    if (!this.tdrSeleccionado) return;
    const tdr = this.tdrSeleccionado;
    const doc = new jsPDF();

    // Título
    doc.setFillColor(0, 51, 102); 
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FICHA TÉCNICA DEL TDR', 105, 20, { align: 'center' });

    // Datos Principales
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    let y = 45;

    // Función auxiliar para filas
    const addRow = (label: string, value: string) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 14, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 70, y);
        y += 8;
        doc.setDrawColor(220, 220, 220);
        doc.line(14, y-5, 196, y-5); // Línea separadora
        y += 4;
    };

    addRow('NÚMERO TDR:', tdr.numero_tdr || '---');
    addRow('ESTADO:', tdr.estado || 'BORRADOR');
    addRow('PRESUPUESTO:', `$${Number(tdr.presupuesto_referencial || 0).toFixed(2)}`);
    addRow('DIRECCIÓN:', tdr.nombre_direccion || tdr.direccion_solicitante || '---');
    addRow('RESPONSABLE:', tdr.responsable_designado || 'No asignado');
    addRow('FECHA INICIO:', tdr.fecha_inicio_contrato ? tdr.fecha_inicio_contrato.split('T')[0] : '---');
    addRow('FECHA FIN:', tdr.fecha_fin_contrato ? tdr.fecha_fin_contrato.split('T')[0] : '---');

    // Objeto de Contratación (Multilinea)
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('OBJETO DE CONTRATACIÓN:', 14, y);
    y += 6;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(tdr.objeto_contratacion || '', 180);
    doc.text(splitText, 14, y);
    y += (splitText.length * 5) + 10;

    // Sección Archivos
    doc.setFillColor(240, 240, 240);
    doc.rect(14, y, 182, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('EXPEDIENTE DIGITAL (ARCHIVOS)', 16, y + 6);
    y += 15;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    const check = (val: any) => val ? '✅ SI' : '❌ NO';
    
    doc.text(`1. Informe de Necesidad:  ${check(tdr.nombre_archivo_necesidad)}`, 20, y);
    if(tdr.nombre_archivo_necesidad) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`   (${tdr.nombre_archivo_necesidad})`, 20, y+5);
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
    }
    y += 15;

    doc.text(`2. Documento TDR:       ${check(tdr.nombre_archivo_tdr)}`, 20, y);
    if(tdr.nombre_archivo_tdr) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`   (${tdr.nombre_archivo_tdr})`, 20, y+5);
    }

    doc.save(`Ficha_${tdr.numero_tdr}.pdf`);
  }

  // ==========================================
  // GESTIÓN TDR (CRUD)
  // ==========================================

  abrirModalNuevo() {
    this.esEdicion = false;
    this.idTdrEditar = null;
    this.limpiarFormulario();
    this.nuevoTdr.numero_tdr = 'TDR-2025-' + Math.floor(Math.random() * 1000);
    this.mostrarModal = true;
  }

  editarTdr(tdr: any) {
    if (!this.esAdmin) return;
    this.esEdicion = true;
    this.idTdrEditar = tdr.id_tdr || tdr.id; 

    this.nuevoTdr = {
      numero_tdr: tdr.numero_tdr,
      tipo_proceso: tdr.nombre_proceso || tdr.tipo_proceso || 'Ínfima Cuantía',
      objeto_contratacion: tdr.objeto_contratacion,
      direccion_solicitante: tdr.nombre_direccion || tdr.direccion_solicitante || '',
      presupuesto: tdr.presupuesto_referencial || tdr.presupuesto || 0,
      responsable_designado: tdr.responsable_designado,
      periodo_contrato: tdr.periodo_contrato,
      fecha_inicio: tdr.fecha_inicio_contrato ? String(tdr.fecha_inicio_contrato).split('T')[0] : '',
      fecha_fin: tdr.fecha_fin_contrato ? String(tdr.fecha_fin_contrato).split('T')[0] : '',
      estado: tdr.estado || 'BORRADOR'
    };
    this.verificarDireccionCustom();
    this.mostrarModal = true;
  }

  cerrarModal() { this.mostrarModal = false; }

  guardarTdr() {
    // 1. Validaciones
    if (!this.nuevoTdr.numero_tdr || !this.nuevoTdr.objeto_contratacion || !this.nuevoTdr.presupuesto) {
        Swal.fire('Atención', 'Por favor completa los campos obligatorios', 'warning');
        return;
    }

    // 2. Determinar dirección
    const direccionFinal = this.mostrarOtraDireccion ? this.otraDireccionTexto : this.nuevoTdr.direccion_solicitante;
    if (!direccionFinal) {
        Swal.fire('Error', 'Especifica la dirección solicitante', 'warning');
        return;
    }

    // 3. Preparar Objeto JSON
    const datosParaEnviar = {
        numero_tdr: this.nuevoTdr.numero_tdr,
        tipo_proceso: this.nuevoTdr.tipo_proceso,
        objeto_contratacion: this.nuevoTdr.objeto_contratacion,
        direccion_solicitante: direccionFinal,
        presupuesto_referencial: this.nuevoTdr.presupuesto,
        responsable_designado: this.nuevoTdr.responsable_designado,
        periodo_contrato: this.nuevoTdr.periodo_contrato,
        fecha_inicio_contrato: this.nuevoTdr.fecha_inicio,
        fecha_fin_contrato: this.nuevoTdr.fecha_fin,
        id_usuario: 1 
    };

    if (this.esEdicion) {
      this.tdrService.updateTdr(this.idTdrEditar, datosParaEnviar).subscribe({
        next: () => {
          Swal.fire('¡Actualizado!', 'TDR actualizado correctamente', 'success');
          this.cerrarModal();
          this.obtenerTdrs();
        },
        error: (err) => Swal.fire('Error', err.error?.message || 'Error al actualizar', 'error')
      });
    } else {
      this.tdrService.createTdr(datosParaEnviar).subscribe({
        next: () => {
          Swal.fire('¡Creado!', 'TDR registrado. Ahora sube los archivos.', 'success');
          this.cerrarModal();
          this.obtenerTdrs();
        },
        error: (err) => Swal.fire('Error', err.error?.message || 'Error al crear', 'error')
      });
    }
  }

  eliminarTdr(tdr: any) {
    if (!this.esAdmin) return;
    Swal.fire({
      title: '¿Eliminar TDR?',
      text: "No podrás revertir esto",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.tdrService.deleteTdr(tdr.id_tdr || tdr.id).subscribe(() => this.obtenerTdrs());
      }
    });
  }

  // ==========================================
  // GESTIÓN DE ARCHIVOS
  // ==========================================

  verTdr(tdr: any) {
    this.tdrSeleccionado = tdr;
    this.mostrarModalVer = true;
  }

  cerrarModalVer() {
    this.mostrarModalVer = false;
    this.tdrSeleccionado = null;
    this.archivoCapturado = null;
  }

  triggerUpload(tipo: string) {
    const idInput = tipo === 'necesidad' ? 'file-necesidad' : 'file-tdr';
    const input = document.getElementById(idInput) as HTMLElement;
    if (input) input.click();
  }

  onFileSelected(event: any, tipoDoc: string) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.archivoCapturado = file;
      this.subirDocumento(tipoDoc);
    } else {
      Swal.fire('Error', 'Solo se permiten archivos PDF', 'error');
    }
  }

  subirDocumento(tipoDoc: string) {
    if (!this.archivoCapturado || !this.tdrSeleccionado) return;
    const id = this.tdrSeleccionado.id_tdr || this.tdrSeleccionado.id;
    const fd = new FormData();
    fd.append('miArchivo', this.archivoCapturado);
    fd.append('id_tdr', id.toString());
    fd.append('tipo_documento', tipoDoc); 

    Swal.fire({ title: 'Subiendo...', didOpen: () => Swal.showLoading() });
    
    this.http.post('http://localhost:3000/api/archivos/upload', fd).subscribe({
      next: (res: any) => {
        Swal.fire('¡Subido!', 'Archivo cargado correctamente', 'success');
        // Actualizamos vista
        if(tipoDoc === 'necesidad') {
            this.tdrSeleccionado.nombre_archivo_necesidad = res.archivo.nombre_original;
            this.tdrSeleccionado.id_archivo_necesidad = res.archivo.id_archivo;
            this.tdrSeleccionado.ruta_necesidad = res.archivo.ruta_almacenamiento; // Importante para ver
        } else {
            this.tdrSeleccionado.nombre_archivo_tdr = res.archivo.nombre_original;
            this.tdrSeleccionado.id_archivo_tdr = res.archivo.id_archivo;
            this.tdrSeleccionado.ruta_tdr = res.archivo.ruta_almacenamiento;
        }
        this.obtenerTdrs();
      },
      error: (e) => Swal.fire('Error', 'Fallo al subir archivo', 'error')
    });
  }

  descargarArchivo(nombreArchivo: string) {
    if(!nombreArchivo) return;
    const url = `http://localhost:3000/api/archivos/descargar/${nombreArchivo}`;
    window.open(url, '_blank');
  }

  eliminarArchivo(idArchivo: number) {
    if (!this.esAdmin) return;

    Swal.fire({
      title: '¿Borrar archivo?',
      text: "Esta acción es irreversible y solo para Administradores.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, borrar'
    }).then((result) => {
      if (result.isConfirmed) {
        let token = localStorage.getItem('token'); 
        if (token) token = token.replace(/['"]+/g, '');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.delete(`http://localhost:3000/api/archivos/${idArchivo}`, { headers }).subscribe({
            next: () => {
                Swal.fire('Eliminado', 'El archivo ha sido borrado.', 'success');
                if (this.tdrSeleccionado.id_archivo_necesidad === idArchivo) {
                    this.tdrSeleccionado.nombre_archivo_necesidad = null;
                } else if (this.tdrSeleccionado.id_archivo_tdr === idArchivo) {
                    this.tdrSeleccionado.nombre_archivo_tdr = null;
                }
                this.obtenerTdrs();
            },
            error: (e) => Swal.fire('Error', 'No se pudo eliminar', 'error')
        });
      }
    });
  }

  // --- HELPERS (YA NO ESTÁN VACÍOS) ---
  
  limpiarFormulario() {
      this.nuevoTdr = {
        numero_tdr: '', tipo_proceso: 'Ínfima Cuantía', objeto_contratacion: '',
        direccion_solicitante: '', presupuesto: 0, responsable_designado: '',
        periodo_contrato: '', fecha_inicio: '', fecha_fin: '', estado: 'BORRADOR'
      };
      this.mostrarOtraDireccion = false;
      this.otraDireccionTexto = '';
  }

  verificarDireccion() {
      if (this.nuevoTdr.direccion_solicitante === 'Otras') {
          this.mostrarOtraDireccion = true;
      } else {
          this.mostrarOtraDireccion = false;
      }
  }

  verificarDireccionCustom() {
    const estandar = ['TICs (Tecnología)', 'Administrativa Financiera', 'Dirección Ejecutiva', 'Meteorología', 'Hidrología'];
    if (this.nuevoTdr.direccion_solicitante && !estandar.includes(this.nuevoTdr.direccion_solicitante)) {
        this.mostrarOtraDireccion = true;
        this.otraDireccionTexto = this.nuevoTdr.direccion_solicitante;
        this.nuevoTdr.direccion_solicitante = 'Otras';
    } else {
        this.mostrarOtraDireccion = false;
    }
  }

  getClaseBadge(e: any) { 
      const estado = String(e || '').toUpperCase();
      if(estado.includes('BORRADOR')) return 'badge-borrador';
      if(estado.includes('VIGENTE') || estado.includes('PUBLICADO')) return 'badge-publicado';
      return 'badge-revision';
  }

  getTextoEstado(e: any) { return e ? String(e).toUpperCase() : 'BORRADOR'; }
}