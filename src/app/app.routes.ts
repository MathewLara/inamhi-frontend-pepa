import { Routes } from '@angular/router';
import { LoginComponent } from './login/login'; // Se llama login.ts
import { DashboardComponent } from './dashboard/dashboard'; // Se llama dashboard.ts
import { TdrListaComponent } from './tdr-lista/tdr-lista'; // Se llama tdr-lista.ts
import { TdrFormComponent } from './tdr-form/tdr-form'; // Se llama tdr-form.ts
import { MantenimientosComponent } from './mantenimientos/mantenimientos'; // Se llama mantenimientos.ts
import { ContratosComponent } from './contratos/contratos'; // Se llama contratos.ts
import { ContratosFormComponent } from './contratos-form/contratos-form'; // Se llama contratos-form.ts
import { AuditoriaComponent } from './auditoria/auditoria.component'; // Este SÍ se llama .component.ts
import { UsuariosComponent } from './usuarios/usuarios.component'; // Este también

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'tdr-lista', component: TdrListaComponent },
    { path: 'nuevo-tdr', component: TdrFormComponent },
    { path: 'mantenimientos', component: MantenimientosComponent },
    { path: 'contratos', component: ContratosComponent },
    { path: 'nuevo-contrato', component: ContratosFormComponent },
    { path: 'auditoria', component: AuditoriaComponent },
    { path: 'usuarios', component: UsuariosComponent }
];