import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  usuario: string = '';
  password: string = ''; // <--- Tu variable se llama password
  mensajeError: string = '';
  cargando: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  ingresar() {
    // 1. Validaciones básicas
    if (!this.usuario || !this.password) {
      this.mensajeError = '⚠️ Por favor ingresa usuario y contraseña.';
      return;
    }

    this.mensajeError = '';
    this.cargando = true;

    // 2. UNA SOLA LLAMADA AL BACKEND
    this.authService.login(this.usuario, this.password).subscribe({
      next: (res) => {
        console.log('Respuesta real del servidor:', res);
        
        // 3. LIMPIEZA NUCLEAR DE MEMORIA VIEJA
        localStorage.clear(); 
        sessionStorage.clear();

        // 4. GUARDAR SESIÓN Y NAVEGAR
        // Usamos 'res.token' y 'res.usuario' que vienen del backend
        this.authService.guardarSesion(res.token, res.usuario);
        
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error login:', err);
        this.cargando = false;
        
        if (err.status === 401) {
          this.mensajeError = '⛔ Usuario o contraseña incorrectos.';
        } else {
          this.mensajeError = '⚠️ Error de conexión con el servidor.';
        }
      }
    });
  }
}