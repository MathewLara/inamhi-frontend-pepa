import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; 
import { ContratoService } from '../services/contrato.service'; 
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contratos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './contratos.html',
  styleUrl: './contratos.css'
})
export class ContratosComponent implements OnInit {

  listaContratos: any[] = [];
  listaDirecciones: any[] = [];
  listaSupervisores: any[] = [];
  
  esAdmin: boolean = false; 

  nuevoContrato = {
    numero: '', cedula: '', nombre: '', honorarios: null as number | null,
    inicio: '', fin: '', direccion_domicilio: '', objeto_contrato: '',
    id_direccion_solicitante: '', id_usuario_supervisor: ''
  };

  mostrarModalCrear: boolean = false;
  mostrarModalVer: boolean = false; 
  seleccionado: any = null; 
  esEdicion: boolean = false;      
  idContratoEditar: any = null;    

  // --- NUEVA VARIABLE PARA GESTIÓN DE ARCHIVOS PDF ---
  archivoCapturado: File | null = null; 

  constructor(
    private contratoService: ContratoService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.verificarRol(); 
    this.cargarListas();
    this.cargarContratos();
  }

  verificarRol() {
    const data = localStorage.getItem('usuario'); 
    if (data) {
      try {
        const userObj = JSON.parse(data);
        const rolTexto = (userObj.rol || userObj.nombre_rol || '').toLowerCase();
        this.esAdmin = rolTexto.includes('administrador') && !rolTexto.includes('técnico');
      } catch (e) { 
        this.esAdmin = false;
      }
    }
  }

  // ==========================================
  // LÓGICA DE CARGA DE PDF (REQUERIMIENTO 3.4)
  // ==========================================

  /**
   * Captura el archivo seleccionado y valida el formato PDF [cite: 105, 111]
   */
  onFileSelected(event: any, tipoDoc: string) {
    const file: File = event.target.files[0];
    
    // Validación de formato PDF obligatoria para verificables [cite: 108, 110]
    if (file && file.type === 'application/pdf') {
        this.archivoCapturado = file;
        
        // Si es el informe técnico final, se puede subir automáticamente al seleccionar [cite: 110]
        if (tipoDoc === 'informe_final') {
          this.subirDocumento(tipoDoc);
        }
    } else {
        Swal.fire('Formato no válido', 'El sistema solo permite archivos en formato PDF para el control documental.', 'error');
        event.target.value = ''; 
    }
  }

  /**
   * Envía el archivo al servidor para vincularlo al contrato 
   */
  subirDocumento(tipoDoc: string) {
    if (!this.archivoCapturado || !this.seleccionado) {
      Swal.fire('Atención', 'Seleccione un archivo PDF antes de subir.', 'info');
      return;
    }

    const formData = new FormData();
    formData.append('archivo', this.archivoCapturado);
    formData.append('id_contrato', this.seleccionado.id_contrato);
    formData.append('tipo', tipoDoc); // Categoría: informe mensual, producto, informe final [cite: 106, 107, 110]

    Swal.fire({ title: 'Subiendo...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    this.contratoService.subirArchivoContrato(formData).subscribe({
        next: () => {
            Swal.fire('Éxito', 'Archivo cargado correctamente al expediente del profesional.', 'success');
            this.archivoCapturado = null;
            this.cargarContratos(); // Refrescar para visualizar los cambios
        },
        error: (err) => {
          console.error("Error al subir verificable", err);
          Swal.fire('Error', 'No se pudo subir el archivo al servidor.', 'error');
        }
    });
  }

  // ==========================================
  // FUNCIONALIDADES ORIGINALES MANTENIDAS
  // ==========================================

  cargarListas() {
    this.contratoService.getCatalogos().subscribe({
      next: (data: any) => {
        this.listaDirecciones = data.areas || [];
        this.listaSupervisores = data.supervisores || [];
      }
    });
  }

  cargarContratos() {
    this.contratoService.getContratos().subscribe({
      next: (data: any) => {
        this.listaContratos = data;
        this.cd.detectChanges();
      }
    });
  }

  abrirModalCrear() {
    if (!this.esAdmin) return; 
    this.esEdicion = false;
    this.idContratoEditar = null;
    this.nuevoContrato = {
      numero: '', cedula: '', nombre: '', honorarios: null, 
      inicio: '', fin: '', direccion_domicilio: '', 
      objeto_contrato: '', id_direccion_solicitante: '', id_usuario_supervisor: ''
    };
    this.mostrarModalCrear = true;
  }

  abrirModalEditar(c: any) {
    if (!this.esAdmin) return; 
    this.esEdicion = true;
    this.idContratoEditar = c.id_contrato;
    this.nuevoContrato = {
      numero: c.numero_contrato,
      cedula: c.cedula_profesional,
      nombre: c.nombre_completo_profesional,
      honorarios: c.honorarios_mensuales,
      inicio: c.fecha_inicio ? c.fecha_inicio.split('T')[0] : '',
      fin: c.fecha_fin ? c.fecha_fin.split('T')[0] : '',
      direccion_domicilio: c.direccion_domicilio,
      objeto_contrato: c.objeto_contrato || '',
      id_direccion_solicitante: c.id_direccion_solicitante,
      id_usuario_supervisor: c.id_usuario_supervisor
    };
    this.mostrarModalCrear = true; 
  }

  cerrarModalCrear() { this.mostrarModalCrear = false; }

  guardarContrato() {
    if (!this.esAdmin) return; 
    const datosEnviar = { ...this.nuevoContrato, idArea: this.nuevoContrato.id_direccion_solicitante, idSupervisor: this.nuevoContrato.id_usuario_supervisor };

    if (this.esEdicion) {
      this.contratoService.updateContrato(this.idContratoEditar, datosEnviar).subscribe({
        next: () => { this.cerrarModalCrear(); this.cargarContratos(); Swal.fire('Éxito', 'Actualizado', 'success'); }
      });
    } else {
      this.contratoService.createContrato(datosEnviar).subscribe({
        next: () => { this.cerrarModalCrear(); this.cargarContratos(); Swal.fire('Éxito', 'Guardado', 'success'); }
      });
    }
  }

  verDetalle(c: any) { this.seleccionado = c; this.mostrarModalVer = true; }
  cerrarModalVer() { this.mostrarModalVer = false; this.seleccionado = null; }

  eliminar(id: number) {
    if (!this.esAdmin) return; 
    Swal.fire({
      title: '¿Eliminar?', text: "No podrás revertirlo", icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Sí, borrar', confirmButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.contratoService.deleteContrato(id).subscribe({
          next: () => { this.cargarContratos(); Swal.fire('Eliminado', 'Registro borrado', 'success'); }
        });
      }
    });
  }
}