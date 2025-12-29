import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; // <--- Se quitó RouterLink
import { TdrService } from '../services/tdr.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tdr-form',
  standalone: true,
  imports: [CommonModule, FormsModule], // <--- Se quitó RouterLink de aquí también
  templateUrl: './tdr-form.html',
  styleUrls: ['./tdr-form.css']
})
export class TdrFormComponent implements OnInit {

  // --- VARIABLES DE DATOS (FUSIONADAS EN OBJETO) ---
  nuevoTdr: any = {
    numero_tdr: '',
    tipo_proceso: 'Ínfima Cuantía',
    objeto_contratacion: '',
    direccion_solicitante: '', 
    presupuesto: 0,
    fecha_inicio: '',
    fecha_fin: '',
    responsable_designado: '', // Nuevo campo
    periodo_contrato: '',      // Nuevo campo
    estado: 'BORRADOR'
  };

  // --- VARIABLES DE LÓGICA UI ---
  mostrarOtraDireccion: boolean = false;
  otraDireccionTexto: string = '';
  
  // --- VARIABLES DE CONTROL EDICIÓN ---
  esEdicion: boolean = false;
  idTdrEditar: any = null;

  // --- ARCHIVOS ---
  archivoNecesidad: File | null = null;
  archivoTdr: File | null = null;

  constructor(
    private tdrService: TdrService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // 1. Verificar si estamos editando (Lógica original conservada)
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.esEdicion = true;
        this.idTdrEditar = id;
        this.cargarDatosParaEditar(id);
      } else {
        // 2. Si es nuevo, generamos código automático (Lógica nueva)
        this.nuevoTdr.numero_tdr = 'TDR-2025-' + Math.floor(Math.random() * 1000);
      }
    });
  }

  // --- LÓGICA DE CARGA PARA EDICIÓN (CONSERVADA Y MEJORADA) ---
  cargarDatosParaEditar(id: any) {
    this.tdrService.getTdrById(id).subscribe({
      next: (data: any) => {
        // Mapeamos los datos que vienen del backend al objeto nuevoTdr
        this.nuevoTdr = {
          numero_tdr: data.numero_tdr,
          tipo_proceso: data.tipo_proceso || 'Ínfima Cuantía',
          objeto_contratacion: data.objeto_contratacion,
          presupuesto: data.presupuesto_referencial || data.presupuesto, // Tolerancia a nombres de campo
          // Manejo seguro de fechas para input HTML (YYYY-MM-DD)
          fecha_inicio: data.fecha_inicio_contrato ? data.fecha_inicio_contrato.split('T')[0] : '',
          fecha_fin: data.fecha_fin_contrato ? data.fecha_fin_contrato.split('T')[0] : '',
          responsable_designado: data.responsable_designado || '',
          periodo_contrato: data.periodo_contrato || '',
          estado: data.estado || 'BORRADOR',
          direccion_solicitante: data.direccion_solicitante
        };

        // Lógica inteligente: Si la dirección no es una de las estándar, activar "Otras"
        const direccionesEstandar = ['TICs (Tecnología)', 'Administrativa Financiera', 'Dirección Ejecutiva', 'Meteorología', 'Hidrología'];
        if (!direccionesEstandar.includes(this.nuevoTdr.direccion_solicitante)) {
           this.mostrarOtraDireccion = true;
           this.otraDireccionTexto = this.nuevoTdr.direccion_solicitante;
           this.nuevoTdr.direccion_solicitante = 'Otras'; // Para que el select marque 'Otras'
        }
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo cargar el TDR seleccionado', 'error');
      }
    });
  }

  // --- LÓGICA DE NUEVOS CAMPOS ---
  verificarDireccion() {
    if (this.nuevoTdr.direccion_solicitante === 'Otras') {
      this.mostrarOtraDireccion = true;
    } else {
      this.mostrarOtraDireccion = false;
      this.otraDireccionTexto = ''; 
    }
  }

  onFileSelected(event: any, tipo: string) {
    const file = event.target.files[0];
    if (file) {
      if (tipo === 'necesidad') this.archivoNecesidad = file;
      if (tipo === 'tdr') this.archivoTdr = file;
    }
  }
  // --- GUARDADO UNIFICADO (CORREGIDO PARA JSON) ---
  guardarTdr() {
    // 1. Validaciones básicas
    if (!this.nuevoTdr.numero_tdr || !this.nuevoTdr.objeto_contratacion || !this.nuevoTdr.presupuesto) {
      Swal.fire('Atención', 'Por favor completa los campos obligatorios', 'warning');
      return;
    }

    // Determinar la dirección final
    const direccionFinal = this.mostrarOtraDireccion ? this.otraDireccionTexto : this.nuevoTdr.direccion_solicitante;
    if (!direccionFinal) {
        Swal.fire('Error', 'Debes especificar la dirección solicitante', 'warning');
        return;
    }

    // 2. PREPARAR EL JSON (OBJETO LIMPIO)
    // NOTA: No enviamos archivos aquí. Los archivos se suben en la lista (Botón Lupa)
    // Esto asegura que el TDR se cree primero en la BD sin errores.
    const datosParaEnviar = {
        numero_tdr: this.nuevoTdr.numero_tdr,
        tipo_proceso: this.nuevoTdr.tipo_proceso,
        objeto_contratacion: this.nuevoTdr.objeto_contratacion,
        direccion_solicitante: direccionFinal,
        presupuesto_referencial: this.nuevoTdr.presupuesto, // Asegurar coincidencia con BD
        responsable_designado: this.nuevoTdr.responsable_designado,
        periodo_contrato: this.nuevoTdr.periodo_contrato,
        fecha_inicio_contrato: this.nuevoTdr.fecha_inicio,
        fecha_fin_contrato: this.nuevoTdr.fecha_fin,
        id_usuario: 1 // O el ID real del usuario logueado si lo tienes
    };

    if (this.esEdicion) {
      // === MODO EDICIÓN ===
      this.tdrService.updateTdr(this.idTdrEditar, datosParaEnviar).subscribe({
        next: () => {
          Swal.fire('¡Actualizado!', 'TDR actualizado correctamente', 'success');
          this.router.navigate(['/tdr-lista']);
        },
        error: (err) => Swal.fire('Error', err.error?.message || 'No se pudo actualizar', 'error')
      });

    } else {
      // === MODO CREACIÓN ===
      // Usamos createTdr enviando JSON puro, igual que en el Postman
      this.tdrService.createTdr(datosParaEnviar).subscribe({
        next: (res: any) => {
          Swal.fire({
            title: '¡TDR Creado!',
            text: 'Ahora puedes subir los archivos PDF desde el listado (Botón Lupa 🔍)',
            icon: 'success'
          }).then(() => {
            this.router.navigate(['/tdr-lista']);
          });
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', err.error?.error || 'Error al guardar el TDR', 'error');
        }
      });
    }
  }
  cancelar() {
    this.router.navigate(['/tdr-lista']);
  }
}