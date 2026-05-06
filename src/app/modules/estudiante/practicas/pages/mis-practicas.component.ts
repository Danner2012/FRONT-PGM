import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PracticaService } from '../../../../services/practica.service';

@Component({
  selector: 'app-mis-practicas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-practicas.component.html',
  styleUrls: ['../styles/mis-practicas.component.css']
})
export class MisPracticasComponent implements OnInit {
  private practicaService = inject(PracticaService);

  practicas = signal<any[]>([]);
  isLoading = signal(true);
  filterText = signal('');

  // Prácticas filtradas por el texto de búsqueda
  filteredPracticas = computed(() => {
    const text = this.filterText().toLowerCase();
    if (!text) return this.practicas();
    return this.practicas().filter(p => 
      p.titulo.toLowerCase().includes(text) || 
      p.curso_nombre.toLowerCase().includes(text) ||
      p.descripcion.toLowerCase().includes(text)
    );
  });

  ngOnInit() {
    this.loadMisPracticas();
  }

  loadMisPracticas() {
    this.isLoading.set(true);
    this.practicaService.getMisPracticas().subscribe({
      next: (data) => {
        this.practicas.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando prácticas:', err);
        this.isLoading.set(false);
      }
    });
  }

  getSeverity(estado: boolean): string {
    return estado ? 'success' : 'danger';
  }
}
