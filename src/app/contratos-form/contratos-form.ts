import { Component, OnInit } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
// CORRECCIÓN 1: La ruta correcta con ../../
// ASÍ ES LA CORRECTA:
import { ContratoService } from '../services/contrato.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contratos-form',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './contratos-form.html',
  styleUrl: './contratos-form.css'
})
export class ContratosFormComponent implements OnInit {

  // Variables del Formulario
  nuevoNombre: string = '';
  nuevoCargo: string = '';
  nuevoHonorario: number | null = null;
  nuevoInicio: string = '';
  nuevoFin: string = '';
  
  selectedArea: any = null;       
  selectedSupervisor: any = null; 

  listaAreas: any[] = [];
  listaSupervisores: any[] = [];

  // Variables de Edición
  esEdicion: boolean = false;
  idContratoEditar: any = null;

  constructor(
    private contratoService: ContratoService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.cargarListas();

    // VERIFICAR SI ESTAMOS EDITANDO
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.esEdicion = true;
        this.idContratoEditar = id;
        this.cargarDatosEditar(id);
      }
    });
  }

  cargarListas() {
    this.contratoService.getCatalogos().subscribe({
      next: (data: any) => {
        this.listaAreas = data.areas;
        this.listaSupervisores = data.supervisores;
      },
      // CORRECCIÓN 2: Agregar tipo : any
      error: (err: any) => console.error("Error cargando listas", err)
    });
  }

  cargarDatosEditar(id: any) {
    this.contratoService.getContratoById(id).subscribe({
      next: (data: any) => {
        this.nuevoNombre = data.nombre_completo_profesional;
        this.nuevoCargo = data.cargo_profesional;
        this.nuevoHonorario = data.honorarios_mensuales;
        this.nuevoInicio = data.fecha_inicio ? data.fecha_inicio.split('T')[0] : '';
        this.nuevoFin = data.fecha_fin ? data.fecha_fin.split('T')[0] : '';
        this.selectedArea = data.id_direccion_solicitante;
        this.selectedSupervisor = data.id_usuario_supervisor;
      },
      // CORRECCIÓN 3: Agregar tipo : any
      error: (err: any) => {
        console.error(err);
        Swal.fire('Error', 'No se cargó el contrato', 'error');
      }
    });
  }

  guardar() {
    if (!this.nuevoNombre || !this.nuevoCargo) {
      Swal.fire('Atención', 'Nombre y Cargo son obligatorios.', 'warning');
      return;
    }

    const datosContrato = {
      nombre: this.nuevoNombre,
      cargo: this.nuevoCargo,
      honorarios: Number(this.nuevoHonorario) || 0,
      inicio: this.nuevoInicio !== '' ? this.nuevoInicio : null,
      fin: this.nuevoFin !== '' ? this.nuevoFin : null,
      idArea: this.selectedArea,
      idSupervisor: this.selectedSupervisor
    };

    if (this.esEdicion) {
      // ACTUALIZAR
      this.contratoService.updateContrato(this.idContratoEditar, datosContrato).subscribe({
        next: () => {
          Swal.fire('¡Actualizado!', 'Contrato editado correctamente', 'success');
          this.router.navigate(['/contratos']);
        },
        // CORRECCIÓN 4: Agregar tipo : any
        error: (err: any) => {
           console.error(err);
           Swal.fire('Error', 'Error al actualizar', 'error');
        }
      });
    } else {
      // CREAR
      this.contratoService.createContrato(datosContrato).subscribe({
        next: () => {
          Swal.fire('¡Éxito!', 'Contrato creado correctamente', 'success');
          this.router.navigate(['/contratos']);
        },
        // CORRECCIÓN 5: Agregar tipo : any
        error: (err: any) => {
           console.error(err);
           Swal.fire('Error', 'Error al crear', 'error');
        }
      });
    }
  }
}