import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PracticaService } from '../../../../../services/practica.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-simulation-workspace',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './simulation-workspace.component.html',
  styleUrls: ['./simulation-workspace.component.css']
})
export class SimulationWorkspaceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private practicaService = inject(PracticaService);

  practica = signal<any>(null);
  isLoading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPractica(Number(id));
    } else {
      this.router.navigate(['/dashboard/mis-practicas']);
    }
  }

  loadPractica(id: number) {
    this.isLoading.set(true);
    this.practicaService.getPractica(id).subscribe({
      next: (data) => {
        this.practica.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando práctica:', err);
        Swal.fire('Error', 'No se pudo cargar la información de la práctica', 'error');
        this.router.navigate(['/dashboard/mis-practicas']);
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard/mis-practicas']);
  }

  getResourceUrl(recurso: any): string | null {
    if (recurso.url_externa) return recurso.url_externa;
    if (recurso.archivo_local) {
      return recurso.archivo_local.startsWith('http') 
        ? recurso.archivo_local 
        : `http://localhost:8000${recurso.archivo_local}`;
    }
    return null;
  }

  isVideo(recurso: any): boolean {
    const url = this.getResourceUrl(recurso);
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mkv', '.avi', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext)) || 
           (recurso.tipo_recurso_nombre && recurso.tipo_recurso_nombre.toLowerCase().includes('video'));
  }
}
