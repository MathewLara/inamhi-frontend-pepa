import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; 
import { HttpClient } from '@angular/common/http'; // <--- Necesario para subir archivos
import { ContratoService } from '../services/contrato.service'; 
import Swal from 'sweetalert2';

// --- IMPORTACIONES PARA PDF ---
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-contratos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './contratos.html', // Asegúrate que coincida con tu nombre de archivo
  styleUrls: ['./contratos.css']
})
export class ContratosComponent implements OnInit {

  listaContratos: any[] = [];
  listaDirecciones: any[] = [];
  listaSupervisores: any[] = [];
  
  esAdmin: boolean = false; 

  // Objeto para Crear/Editar
  nuevoContrato: any = {
    numero: '', cedula: '', nombre: '', honorarios: null,
    inicio: '', fin: '', direccion_domicilio: '', objeto_contrato: '',
    id_direccion_solicitante: '', id_usuario_supervisor: ''
  };

  // Variables de Control Visual
  mostrarModalCrear: boolean = false;
  mostrarModalVer: boolean = false; 
  seleccionado: any = null; 
  esEdicion: boolean = false;      
  idContratoEditar: any = null;    

  // Variable para subida de archivos
  archivoCapturado: File | null = null; 

  constructor(
    private contratoService: ContratoService, 
    private http: HttpClient,
    private cd: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.verificarRol();
    this.cargarCatalogos();
    this.cargarContratos();
  }

  // --- 1. CARGA DE DATOS ---
  verificarRol() {
    const data = localStorage.getItem('usuario');
    if (data) {
      const user = JSON.parse(data);
      const rol = (user.rol || user.nombre_rol || '').toLowerCase();
      this.esAdmin = rol.includes('admin');
    }
  }

  cargarCatalogos() {
    this.contratoService.getCatalogos().subscribe({
      next: (res: any) => {
        this.listaDirecciones = res.areas || [];
        this.listaSupervisores = res.supervisores || [];
      }
    });
  }

  cargarContratos() {
    this.contratoService.getContratos().subscribe({
      next: (data: any[]) => {
        this.listaContratos = data;
        this.cd.detectChanges();
      }
    });
  }

  // ==========================================
  // 🖨️ 2. FUNCIÓN EXPORTAR PDF (REQUERIDO)
  // ==========================================
  exportarPDF() {
    const doc = new jsPDF('l', 'mm', 'a4'); // Horizontal

    // Encabezado
    doc.setFillColor(0, 51, 102);
    doc.rect(0, 0, 297, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('REPORTE DE CONTRATOS - INAMHI', 14, 13);
    
    // Datos
    const head = [['Número', 'Profesional', 'Cédula', 'Objeto', 'Honorarios', 'Estado']];
    const data = this.listaContratos.map(c => [
      c.numero_contrato,
      c.nombre_completo_profesional,
      c.cedula_profesional,
      c.objeto_contrato,
      `$${c.honorarios_mensuales}`,
      c.estado
    ]);

    // Generar tabla
    (autoTable as any)(doc, {
      startY: 30,
      head: head,
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102] }
    });

    doc.save('Reporte_Contratos.pdf');
  }

  // ==========================================
  // 📂 3. GESTIÓN DE ARCHIVOS (LO QUE FALTABA)
  // ==========================================
  
  // Se ejecuta cuando seleccionas un archivo en el input
  onFileSelected(event: any, tipo: string) {
    if (event.target.files.length > 0) {
        this.archivoCapturado = event.target.files[0];
    }
  }

  // Se ejecuta al dar clic en la flechita "Subir"
  subirDocumento(tipoDoc: string) {
    if (!this.archivoCapturado || !this.seleccionado) {
        Swal.fire('Atención', 'Selecciona un archivo PDF primero', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('miArchivo', this.archivoCapturado);
    formData.append('id_contrato', this.seleccionado.id_contrato); // Vinculamos al contrato
    formData.append('tipo_documento', tipoDoc); 
    
    // URL de tu Backend (Asegúrate que sea el puerto correcto, ej: 3000)
    const urlUpload = 'http://localhost:3000/api/archivos/upload';

    Swal.fire({ title: 'Subiendo...', didOpen: () => Swal.showLoading() });

    this.http.post(urlUpload, formData).subscribe({
        next: (res: any) => {
            Swal.fire('¡Subido!', 'Archivo cargado correctamente', 'success');
            
            // Actualizamos la lista de archivos visualmente
            if (!this.seleccionado.archivos) this.seleccionado.archivos = [];
            this.seleccionado.archivos.push({
                nombre_archivo: this.archivoCapturado?.name,
                url: res.archivo?.path // O la URL que devuelva tu backend
            });
            this.archivoCapturado = null;
        },
        error: (err) => {
            console.error(err);
            Swal.fire('Error', 'No se pudo subir el archivo', 'error');
        }
    });
  }

  // ==========================================
  // ✏️ 4. LÓGICA CRUD (CREAR/EDITAR/ELIMINAR)
  // ==========================================

  abrirModalCrear() { 
    this.esEdicion = false; 
    this.idContratoEditar = null;
    this.limpiarFormulario();
    this.mostrarModalCrear = true; 
  }

  abrirModalEditar(c: any) { // <--- Nombre corregido para coincidir con HTML
    if (!this.esAdmin) return; 
    this.esEdicion = true;
    this.idContratoEditar = c.id_contrato;
    
    // Rellenar datos
    this.nuevoContrato = {
      numero: c.numero_contrato,
      cedula: c.cedula_profesional,
      nombre: c.nombre_completo_profesional,
      honorarios: c.honorarios_mensuales,
      inicio: c.fecha_inicio ? c.fecha_inicio.split('T')[0] : '',
      fin: c.fecha_fin ? c.fecha_fin.split('T')[0] : '',
      direccion_domicilio: '', 
      objeto_contrato: c.objeto_contrato,
      id_direccion_solicitante: c.id_direccion_solicitante,
      id_usuario_supervisor: c.id_usuario_supervisor
    };
    this.mostrarModalCrear = true; 
  }

  cerrarModalCrear() { this.mostrarModalCrear = false; }

  limpiarFormulario() {
    this.nuevoContrato = {
        numero: '', cedula: '', nombre: '', honorarios: null,
        inicio: '', fin: '', direccion_domicilio: '', objeto_contrato: '',
        id_direccion_solicitante: '', id_usuario_supervisor: ''
    };
  }

  guardarContrato() {
    const datosEnviar = { ...this.nuevoContrato, idArea: this.nuevoContrato.id_direccion_solicitante, idSupervisor: this.nuevoContrato.id_usuario_supervisor };

    if (this.esEdicion) {
      this.contratoService.updateContrato(this.idContratoEditar, datosEnviar).subscribe({
        next: () => { this.cerrarModalCrear(); this.cargarContratos(); Swal.fire('Éxito', 'Contrato Actualizado', 'success'); }
      });
    } else {
      this.contratoService.createContrato(datosEnviar).subscribe({
        next: () => { this.cerrarModalCrear(); this.cargarContratos(); Swal.fire('Éxito', 'Contrato Creado', 'success'); }
      });
    }
  }

  verDetalle(c: any) { 
      this.seleccionado = c; 
      // Si el backend no trae la lista de archivos, la inicializamos vacía para evitar errores
      if(!this.seleccionado.archivos) this.seleccionado.archivos = [];
      this.mostrarModalVer = true; 
  }
  
  cerrarModalVer() { this.mostrarModalVer = false; this.seleccionado = null; }

  eliminar(id: number) {
    if (!this.esAdmin) return; 
    Swal.fire({
      title: '¿Eliminar Contrato?', text: "Esta acción no se puede deshacer", icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, borrar'
    }).then((r) => {
      if (r.isConfirmed) {
        this.contratoService.deleteContrato(id).subscribe({
          next: () => { this.cargarContratos(); Swal.fire('Eliminado', '', 'success'); },
          error: () => Swal.fire('Error', 'No se puede eliminar (tiene datos asociados)', 'error')
        });
      }
    });
  }
}