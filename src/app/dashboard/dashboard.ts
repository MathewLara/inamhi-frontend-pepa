import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';

// Importamos los servicios (Mejor práctica que usar HttpClient directo aquí)
import { TdrService } from '../services/tdr.service';
import { ContratoService } from '../services/contrato.service';
import { MantenimientoService } from '../services/mantenimiento.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'] // Asegúrate que sea styleUrls (plural) o styleUrl (singular) según tu versión de Angular
})
export class DashboardComponent implements OnInit {

  usuarioNombre: string = 'Administrador';
  
  // VARIABLES QUE COINCIDEN CON TU HTML (No usar objeto 'stats')
  totalContratos: number = 0;
  totalTdrs: number = 0;
  totalMantenimientos: number = 0;

  constructor(
    private tdrService: TdrService,
    private contratoService: ContratoService,
    private mantService: MantenimientoService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log("🚀 Iniciando Dashboard...");
    this.cargarDatosUsuario();
    this.cargarEstadisticasReales();
  }

  cargarDatosUsuario() {
    const data = localStorage.getItem('usuario');
    if (data) {
      try {
        const userObj = JSON.parse(data);
        this.usuarioNombre = userObj.nombre || userObj.usuario || 'Administrador';
      } catch (e) { console.error(e); }
    }
  }

  cargarEstadisticasReales() {
    // 1. CARGAR TDRs
    this.tdrService.getTdrs().subscribe({
      next: (data: any[]) => {
        console.log('✅ TDRs cargados:', data.length);
        this.totalTdrs = data.length; // Asignamos a la variable que usa el HTML
        
        // Ejecutamos la alerta de vencimientos
        this.verificarVencimientos(data);
        
        this.cd.detectChanges(); // Forzamos actualización visual
      },
      error: (e) => console.error('Error cargando TDRs:', e)
    });

    // 2. CARGAR CONTRATOS
    this.contratoService.getContratos().subscribe({
      next: (data: any[]) => {
        console.log('✅ Contratos cargados:', data.length);
        this.totalContratos = data.length;
        this.cd.detectChanges();
      },
      error: (e) => console.error('Error cargando Contratos:', e)
    });

    // 3. CARGAR MANTENIMIENTOS
    this.mantService.getMantenimientos().subscribe({
      next: (data: any[]) => {
        console.log('✅ Mantenimientos cargados:', data.length);
        this.totalMantenimientos = data.length;
        this.cd.detectChanges();
      },
      error: (e) => console.error('Error cargando Mantenimientos:', e)
    });
  }

  // --- SISTEMA DE ALERTAS (Requerimiento 3.3) ---
  verificarVencimientos(lista: any[]) {
    const hoy = new Date();
    const alertas: string[] = [];

    lista.forEach(item => {
      // Verificamos si tiene fecha fin y NO está finalizado/anulado
      if (item.fecha_fin && item.estado !== 'FINALIZADO' && item.estado !== 'ANULADO') {
        const fechaFin = new Date(item.fecha_fin);
        
        // Diferencia en milisegundos convertida a días
        const diferencia = fechaFin.getTime() - hoy.getTime();
        const diasRestantes = Math.ceil(diferencia / (1000 * 3600 * 24));

        // Regla: Avisar si faltan 90 días o menos
        if (diasRestantes <= 90) {
          let color = diasRestantes <= 30 ? '#dc3545' : (diasRestantes <= 60 ? '#ffc107' : '#003366'); // Rojo, Amarillo, Azul
          let icono = diasRestantes <= 30 ? '🔥' : '⚠️';
          let texto = diasRestantes < 0 ? `VENCIDO hace ${Math.abs(diasRestantes)} días` : `Vence en ${diasRestantes} días`;

          alertas.push(`
            <li style="margin-bottom: 8px; color: ${color}; font-weight: 500;">
              ${icono} <b>${item.numero_tdr || 'Proceso'}</b>: ${texto}
            </li>
          `);
        }
      }
    });

    // Si hay alertas, mostrar popup
    if (alertas.length > 0) {
      Swal.fire({
        title: '🔔 Alertas de Vencimiento',
        html: `
          <p>Se detectaron procesos próximos a vencer:</p>
          <ul style="text-align: left; list-style: none; padding: 0; font-size: 0.9rem;">
            ${alertas.join('')}
          </ul>
        `,
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#003366',
        backdrop: `rgba(0,0,0,0.4)`
      });
    }
  }
}