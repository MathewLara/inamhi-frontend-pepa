import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // <--- Importante
import { UsuarioService } from '../services/usuario.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {

  listaUsuarios: any[] = [];
  mostrarModal = false;

  // URL directa para asegurar la carga (ajusta si es diferente en tu backend)
  private apiUrl = 'http://localhost:3000/api/usuarios'; 

  nuevoUsuario = {
    nombres: '',
    apellidos: '',
    username: '',
    password: '',
    email: '',
    cargo: '',
    id_rol: 2 
  };

  constructor(
    private usuarioService: UsuarioService,
    private http: HttpClient,          // <--- Inyectamos HttpClient directo
    private cd: ChangeDetectorRef      // <--- Inyectamos detector de cambios
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios(); // Se ejecuta apenas entras
  }

  // --- CORRECCIÓN PRINCIPAL AQUÍ ---
  cargarUsuarios() {
    const token = localStorage.getItem('token');
    
    // Si no hay token, no cargará nada (seguridad)
    if (!token) return;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Hacemos la petición directa para asegurar que lleva el Token
    this.http.get<any[]>(this.apiUrl, { headers }).subscribe({
      next: (res) => {
        console.log('Usuarios cargados:', res); // Verifica en consola
        this.listaUsuarios = res;
        this.cd.detectChanges(); // <--- OBLIGA a Angular a pintar la tabla YA
      },
      error: (err) => {
        console.error('Error cargando usuarios:', err);
      }
    });
  }
  // ---------------------------------

  guardarUsuario() {
    if(!this.nuevoUsuario.username || !this.nuevoUsuario.password || !this.nuevoUsuario.nombres) {
      Swal.fire('Error', 'Completa los datos obligatorios', 'warning');
      return;
    }

    this.usuarioService.crearUsuario(this.nuevoUsuario).subscribe({
      next: () => {
        Swal.fire('Éxito', 'Usuario creado correctamente', 'success');
        this.mostrarModal = false;
        this.cargarUsuarios(); // Recarga la lista inmediatamente
        this.limpiarForm();
      },
      error: (err) => Swal.fire('Error', err.error.error || 'No se pudo crear', 'error')
    });
  }

  cambiarPass(usuario: any) {
    Swal.fire({
      title: `Cambiar clave a ${usuario.username}`,
      input: 'password',
      inputLabel: 'Ingresa la nueva contraseña',
      inputPlaceholder: 'Nueva contraseña...',
      showCancelButton: true,
      confirmButtonText: 'Guardar cambio',
      confirmButtonColor: '#003366'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.usuarioService.cambiarPassword(usuario.id_usuario, result.value).subscribe({
            next: () => Swal.fire('Listo', 'Contraseña actualizada', 'success'),
            error: () => Swal.fire('Error', 'No se pudo cambiar la clave', 'error')
        });
      }
    });
  }
  
  eliminar(id: number) {
      Swal.fire({
          title: '¿Estás seguro?',
          text: "El usuario ya no podrá acceder",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, eliminar'
      }).then((result) => {
          if (result.isConfirmed) {
              this.usuarioService.eliminarUsuario(id).subscribe({
                next: () => {
                  this.cargarUsuarios(); // Recarga la tabla visualmente
                  Swal.fire('Eliminado', '', 'success');
                },
                error: () => Swal.fire('Error', 'No se pudo eliminar', 'error')
              });
          }
      });
  }

  limpiarForm() {
    this.nuevoUsuario = { nombres: '', apellidos: '', username: '', password: '', email: '', cargo: '', id_rol: 2 };
  }
}