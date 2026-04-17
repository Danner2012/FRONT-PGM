import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../services/api.service';

@Component({
  selector: 'app-mis-cursos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-cursos.component.html',
  styleUrls: ['../styles/mis-cursos.component.css']
})
export class MisCursosComponent implements OnInit {
  private apiService = inject(ApiService);
  
  inscripciones = signal<any[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadMisCursos();
  }

  loadMisCursos() {
    this.apiService.getMisCursos().subscribe({
      next: (data) => {
        this.inscripciones.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando cursos:', err);
        this.isLoading.set(false);
      }
    });
  }
}
