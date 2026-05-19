import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PracticaService } from '../../../../services/practica.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-mis-prestamos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-prestamos.component.html',
  styleUrls: ['../styles/mis-prestamos.component.css']
})
export class MisPrestamosComponent implements OnInit {
  private practicaService = inject(PracticaService);
  private authService = inject(AuthService);

  prestamos = signal<any[]>([]);
  user = this.authService.currentUser;
  
  misPrestamos = computed(() => {
    const currentUser = this.user();
    if (!currentUser) return [];
    
    // Filtramos por el nombre del estudiante o ID si el serializer lo permite
    // Asumiendo que el serializer de PrestamoHerramienta incluye información del estudiante
    return this.prestamos().filter(p => {
        // Buscamos coincidencia por correo o ID de usuario si está disponible
        return p.id_inscripcion_detalle?.id_estudiante_detalle?.correo === currentUser.correo;
    });
  });

  ngOnInit() {
    this.loadPrestamos();
  }

  loadPrestamos() {
    this.practicaService.getPrestamos().subscribe(data => {
      this.prestamos.set(data);
    });
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
        case 'prestado': return 'bg-warning text-dark';
        case 'parcial': return 'bg-info text-white';
        case 'devuelto': return 'bg-success text-white';
        default: return 'bg-secondary text-white';
    }
  }
}
