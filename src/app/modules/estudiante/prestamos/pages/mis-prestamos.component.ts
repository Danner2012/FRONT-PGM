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
        case 'prestado': return 'badge-prestado';
        case 'parcial': return 'badge-parcial';
        case 'devuelto': return 'badge-devuelto';
        default: return 'badge-default';
    }
  }
}
