import { Component, OnInit, inject, signal, computed, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HerramientaService } from '../../../../../services/herramienta.service';
import { ThreeViewerComponent } from '../../../../../shared/components/three-viewer/three-viewer.component';

@Component({
  selector: 'app-herramienta-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, ThreeViewerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './herramienta-catalog.component.html',
  styleUrls: ['./herramienta-catalog.component.css']
})
export class HerramientaCatalogComponent implements OnInit {
  private herramientaService = inject(HerramientaService);
  private baseUrl = 'http://localhost:8000'; // URL Base del Backend

  herramientas = signal<any[]>([]);
  categorias = signal<any[]>([]);
  isLoading = signal(false);
  
  // Filtros
  filterText = signal('');
  filterCategoria = signal('todos');

  // Herramienta seleccionada para el visor
  selectedHerramienta = signal<any>(null);
  showViewModal = signal(false);
  activeModelIdx = signal(0);
  previewUrl3D = signal<string | null>(null);
  schemaUrl = signal<string | null>(null);
  scaleValue = signal(1.0);
  rotX = signal(0); rotY = signal(0); rotZ = signal(0);
  activeHUD = signal<string | null>(null);

  filteredHerramientas = computed(() => {
    let data = this.herramientas().filter(h => h.estado); // Solo mostramos herramientas activas
    const text = this.filterText().toLowerCase();
    const categoriaId = this.filterCategoria();

    if (text) {
      data = data.filter(h => 
        h.nombre?.toLowerCase().includes(text) || 
        h.descripcion?.toLowerCase().includes(text)
      );
    }

    if (categoriaId !== 'todos') {
      data = data.filter(h => h.id_categoria?.toString() === categoriaId);
    }

    return data;
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.herramientaService.getHerramientas().subscribe({
      next: (data: any[]) => {
        this.herramientas.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    this.herramientaService.getCategorias().subscribe((data: any[]) => {
      this.categorias.set(data);
    });
  }

  viewHerramienta(h: any) {
    this.selectedHerramienta.set(h);
    this.activeModelIdx.set(0);
    this.showViewModal.set(true);
    this.updatePreview();
  }

  closeModal() {
    this.showViewModal.set(false);
    this.selectedHerramienta.set(null);
  }

  updatePreview() {
    const h = this.selectedHerramienta();
    if (h && h.modelos_3d && h.modelos_3d.length > 0) {
      const model = h.modelos_3d[this.activeModelIdx()];
      this.previewUrl3D.set(model.archivo.startsWith('http') 
        ? model.archivo 
        : `http://localhost:8000${model.archivo}`);
      
      // Manejo del esquema técnico
      if (model.archivo_esquema) {
        this.schemaUrl.set(model.archivo_esquema.startsWith('http')
          ? model.archivo_esquema
          : `http://localhost:8000${model.archivo_esquema}`);
      } else {
        this.schemaUrl.set(null);
      }

      this.scaleValue.set(model.escala);
      const rot = (model.rotacion_default || '0 0 0').split(' ');
      this.rotX.set(parseFloat(rot[0] || '0'));
      this.rotY.set(parseFloat(rot[1] || '0'));
      this.rotZ.set(parseFloat(rot[2] || '0'));
    } else {
      this.previewUrl3D.set(null);
    }
  }

  nextModel() {
    const total = this.selectedHerramienta()?.modelos_3d?.length || 0;
    if (total <= 1) return;
    this.activeModelIdx.update(idx => (idx + 1) % total);
    this.updatePreview();
  }

  prevModel() {
    const total = this.selectedHerramienta()?.modelos_3d?.length || 0;
    if (total <= 1) return;
    this.activeModelIdx.update(idx => (idx - 1 + total) % total);
    this.updatePreview();
  }

  getRotation() {
    return { x: this.rotX(), y: this.rotY(), z: this.rotZ() };
  }

  getImageUrl(path: string | null): string {
    if (!path) return 'logocel.png';
    return path.startsWith('http') ? path : `${this.baseUrl}${path}`;
  }
}
