import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HerramientaService } from '../../../../services/herramienta.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-herramienta-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './herramienta-report.component.html',
  styleUrls: ['../styles/herramienta-report.component.css']
})
export class HerramientaReportComponent implements OnInit {
  private herramientaService = inject(HerramientaService);

  herramientas = signal<any[]>([]);
  categorias = signal<any[]>([]);
  isLoading = signal(false);
  
  // Signals de Filtrado
  filterText = signal('');
  filterCategoria = signal('todos');
  filterStockStatus = signal('todos');

  filteredHerramientas = computed(() => {
    let data = this.herramientas();
    const text = this.filterText().toLowerCase();
    const categoriaId = this.filterCategoria();
    const stockStatus = this.filterStockStatus();

    if (text) {
      data = data.filter(h => 
        h.nombre?.toLowerCase().includes(text) || 
        h.descripcion?.toLowerCase().includes(text) ||
        h.categoria_info?.nombre?.toLowerCase().includes(text)
      );
    }

    if (categoriaId !== 'todos') {
      data = data.filter(h => h.id_categoria?.toString() === categoriaId);
    }

    if (stockStatus !== 'todos') {
      if (stockStatus === 'disponible') {
        data = data.filter(h => h.stock_disponible > 0);
      } else if (stockStatus === 'agotado') {
        data = data.filter(h => h.stock_disponible <= 0);
      } else if (stockStatus === 'bajo') {
        data = data.filter(h => h.stock_disponible > 0 && h.stock_disponible <= 3);
      }
    }

    return data;
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.herramientaService.getHerramientas().subscribe({
      next: (data) => {
        this.herramientas.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    this.herramientaService.getCategorias().subscribe(data => {
      this.categorias.set(data);
    });
  }

  clearFilters() {
    this.filterText.set('');
    this.filterCategoria.set('todos');
    this.filterStockStatus.set('todos');
  }

  getStockClass(h: any): string {
    if (h.stock_disponible <= 0) return 'text-danger fw-bold';
    if (h.stock_disponible <= 3) return 'text-warning fw-bold';
    return 'text-success fw-bold';
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'disponible': return 'bg-success-subtle text-success border-success-subtle';
      case 'agotado': return 'bg-danger-subtle text-danger border-danger-subtle';
      case 'bajo': return 'bg-warning-subtle text-warning border-warning-subtle';
      default: return 'bg-light text-dark';
    }
  }
}
