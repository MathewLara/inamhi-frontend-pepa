import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { TdrService } from '../services/tdr.service'; 
import Swal from 'sweetalert2';

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
  esEdicion: boolean = false; // Controla si es nuevo o edición
  idTdrEditar: any = null;    // Guarda el ID para actualizar
  
  mostrarOtraDireccion: boolean = false;
  otraDireccionTexto: string = '';
  
  // Objeto del formulario
  nuevoTdr: any = {
    numero_tdr: '', tipo_proceso: 'Ínfima Cuantía', objeto_contratacion: '',
    direccion_solicitante: '', presupuesto: 0, responsable_designado: '',
    periodo_contrato: '', fecha_inicio: '', fecha_fin: '', estado: 'BORRADOR'
  };

  // VARIABLES MODAL VER / ARCHIVOS
  mostrarModalVer: boolean = false;
  tdrSeleccionado: any = null;
  archivoCapturado: File | null = null; 
  urlPreview: string | null = null; 
  nombresArchivos: any = {
    informe_necesidad: 'Ningún archivo seleccionado',
    documento_tdr: 'Ningún archivo seleccionado'
  };

  constructor(
    private tdrService: TdrService, 
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

  // ==========================================
  // LÓGICA DE GESTIÓN (CREAR / EDITAR)
  // ==========================================

  // A) ABRIR PARA NUEVO
  abrirModalNuevo() {
    this.esEdicion = false;
    this.idTdrEditar = null;
    this.limpiarFormulario();
    this.nuevoTdr.numero_tdr = 'TDR-2025-' + Math.floor(Math.random() * 1000);
    this.mostrarModal = true;
  }

  // B) ABRIR PARA EDITAR (¡ESTA ES LA CORRECCIÓN!)
  editarTdr(tdr: any) {
    if (!this.esAdmin) return;

    this.esEdicion = true;
    this.idTdrEditar = tdr.id_tdr || tdr.id; 

    // Rellenamos el formulario con los datos de la fila seleccionada
    this.nuevoTdr = {
      numero_tdr: tdr.numero_tdr,
      tipo_proceso: tdr.nombre_proceso || tdr.tipo_proceso || 'Ínfima Cuantía',
      objeto_contratacion: tdr.objeto_contratacion,
      direccion_solicitante: tdr.nombre_direccion || tdr.direccion_solicitante || '',
      presupuesto: tdr.presupuesto_referencial || tdr.presupuesto || 0,
      responsable_designado: tdr.responsable_designado,
      periodo_contrato: tdr.periodo_contrato,
      // Formato fecha para input date (YYYY-MM-DD)
      fecha_inicio: tdr.fecha_inicio_contrato ? String(tdr.fecha_inicio_contrato).split('T')[0] : '',
      fecha_fin: tdr.fecha_fin_contrato ? String(tdr.fecha_fin_contrato).split('T')[0] : '',
      estado: tdr.estado || 'BORRADOR'
    };

    // Verificar si es dirección "Otras" para mostrar el input manual
    this.verificarDireccionCustom();

    this.mostrarModal = true; // <--- ¡ESTO ABRE LA VENTANA!
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  // C) GUARDAR (Soporta CREAR y ACTUALIZAR)
  guardarTdr() {
    if (!this.nuevoTdr.numero_tdr || !this.nuevoTdr.objeto_contratacion) {
      Swal.fire('Atención', 'Complete los campos obligatorios', 'warning');
      return;
    }

    const direccionFinal = this.mostrarOtraDireccion ? this.otraDireccionTexto : this.nuevoTdr.direccion_solicitante;

    // --- MODO EDICIÓN (UPDATE) ---
    if (this.esEdicion) {
       // Datos para actualizar
       const datosUpdate = {
         objeto_contratacion: this.nuevoTdr.objeto_contratacion,
         presupuesto_referencial: this.nuevoTdr.presupuesto,
         fecha_inicio_contrato: this.nuevoTdr.fecha_inicio,
         fecha_fin_contrato: this.nuevoTdr.fecha_fin,
         id_tipo_proceso: 1, // Ajusta si tu backend requiere ID real
         id_direccion_solicitante: 1, // Ajusta si tu backend requiere ID real
         direccion_texto: direccionFinal, 
         responsable_designado: this.nuevoTdr.responsable_designado,
         periodo_contrato: this.nuevoTdr.periodo_contrato
       };

       Swal.fire({ title: 'Actualizando...', didOpen: () => Swal.showLoading() });
       
       this.tdrService.updateTdr(this.idTdrEditar, datosUpdate).subscribe({
         next: () => {
           Swal.fire('¡Éxito!', 'TDR actualizado correctamente.', 'success');
           this.cerrarModal();
           this.obtenerTdrs();
         },
         error: (e) => {
           console.error(e);
           Swal.fire('Error', 'No se pudo actualizar.', 'error');
         }
       });

    } 
    // --- MODO CREACIÓN (CREATE) ---
    else {
       const formData = new FormData();
       formData.append('numero_tdr', this.nuevoTdr.numero_tdr);
       formData.append('tipo_proceso', this.nuevoTdr.tipo_proceso);
       formData.append('objeto_contratacion', this.nuevoTdr.objeto_contratacion);
       formData.append('direccion_solicitante', direccionFinal);
       formData.append('presupuesto', this.nuevoTdr.presupuesto.toString());
       formData.append('responsable_designado', this.nuevoTdr.responsable_designado || '');
       formData.append('periodo_contrato', this.nuevoTdr.periodo_contrato || '');
       formData.append('fecha_inicio', this.nuevoTdr.fecha_inicio || '');
       formData.append('fecha_fin', this.nuevoTdr.fecha_fin || '');
       formData.append('estado', 'BORRADOR');

       Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading() });

       this.tdrService.createTdr(formData).subscribe({
         next: () => {
           Swal.fire('¡Creado!', 'TDR registrado correctamente.', 'success');
           this.cerrarModal();
           this.obtenerTdrs();
         },
         error: (e) => {
           console.error(e);
           Swal.fire('Error', 'No se pudo guardar.', 'error');
         }
       });
    }
  }

  // ==========================================
  // 2. LÓGICA DE SUBIDA DE ARCHIVOS
  // ==========================================

  triggerUpload(tipo: string) {
    const idInput = tipo === 'necesidad' ? 'file-necesidad' : 'file-tdr';
    const input = document.getElementById(idInput) as HTMLElement;
    if (input) input.click();
  }

  onFileSelected(event: any, tipoDoc: string) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.archivoCapturado = file;
      this.nombresArchivos[tipoDoc] = file.name;
      if (tipoDoc !== 'acta_pago') this.subirDocumento(tipoDoc);
    } else {
      Swal.fire('Error', 'Solo se permiten archivos PDF', 'error');
    }
  }

  subirDocumento(tipoDoc: string) {
    if (!this.archivoCapturado || !this.tdrSeleccionado) return;
    const id = this.tdrSeleccionado.id_tdr || this.tdrSeleccionado.id;
    const fd = new FormData();
    fd.append('archivo', this.archivoCapturado);
    fd.append('id_tdr', id.toString());
    fd.append('tipo_documento', tipoDoc);

    Swal.fire({ title: 'Subiendo...', didOpen: () => Swal.showLoading() });
    this.tdrService.subirArchivoTdr(fd).subscribe({
      next: () => {
        Swal.fire('¡Subido!', 'Archivo cargado correctamente', 'success');
        this.obtenerTdrs();
        this.cerrarModalVer();
      },
      error: () => Swal.fire('Error', 'Fallo al subir archivo', 'error')
    });
  }

  // ==========================================
  // 3. FUNCIONALIDADES AUXILIARES
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

  limpiarFormulario() {
    this.nuevoTdr = {
      numero_tdr: '', tipo_proceso: 'Ínfima Cuantía', objeto_contratacion: '',
      direccion_solicitante: '', presupuesto: 0, responsable_designado: '',
      periodo_contrato: '', fecha_inicio: '', fecha_fin: '', estado: 'BORRADOR'
    };
    this.mostrarOtraDireccion = false;
    this.otraDireccionTexto = '';
  }

  verificarDireccionCustom() {
    const fijas = ['TICs (Tecnología)', 'Administrativa Financiera', 'Otras'];
    if (this.nuevoTdr.direccion_solicitante && !fijas.includes(this.nuevoTdr.direccion_solicitante)) {
      this.mostrarOtraDireccion = true;
      this.otraDireccionTexto = this.nuevoTdr.direccion_solicitante;
      this.nuevoTdr.direccion_solicitante = 'Otras';
    } else {
      this.mostrarOtraDireccion = false;
    }
  }

  verificarDireccion() {
    if (this.nuevoTdr.direccion_solicitante === 'Otras') {
      this.mostrarOtraDireccion = true;
    } else {
      this.mostrarOtraDireccion = false;
      this.otraDireccionTexto = '';
    }
  }

  verificarRol() {
    const data = localStorage.getItem('usuario');
    if (data) {
      try {
        const user = JSON.parse(data);
        const rol = (user.rol || user.nombre_rol || '').toLowerCase();
        // Permite editar a admin y administrador
        this.esAdmin = (rol.includes('admin') || rol.includes('administrador'));
      } catch (e) { this.esAdmin = false; }
    }
  }

  eliminarTdr(tdr: any) {
    if (!this.esAdmin) return;
    if(confirm('¿Eliminar este TDR?')) {
      this.tdrService.deleteTdr(tdr.id_tdr || tdr.id).subscribe(() => this.obtenerTdrs());
    }
  }

  getClaseBadge(e: any) { return String(e).includes('BORRADOR') ? 'bg-secondary' : 'bg-primary'; }
  getTextoEstado(e: any) { return e ? String(e).toUpperCase() : 'BORRADOR'; }
}