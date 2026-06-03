import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CursoService } from '../../../../services/curso.service';

@Component({
  selector: 'app-practica-tecnico-curso-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="management-container">
      <!-- ENCABEZADO Y BÚSQUEDA -->
      <div class="row align-items-center mb-5 g-4">
        <div class="col-md-7">
          <h4 class="fw-black mb-1 text-dark">PANEL DE CURSOS</h4>
          <p class="text-muted small mb-0">Selecciona una de tus aulas virtuales para gestionar el contenido práctico.</p>
        </div>
        <div class="col-md-5">
          <div class="search-container">
            <i class="bi bi-search search-icon"></i>
            <input 
              type="text" 
              class="form-control search-input" 
              placeholder="Buscar curso por nombre..." 
              [(ngModel)]="searchTerm"
            >
          </div>
        </div>
      </div>

      <!-- GRID DE CURSOS -->
      <div class="row g-4 animate-fade-in" *ngIf="filteredCursos().length > 0">
        <div class="col-xl-4 col-md-6" *ngFor="let curso of filteredCursos()">
          <div class="curso-card-pro" (click)="onCursoSelect(curso.id)">
            <div class="card-glow"></div>
            <div class="card-content">
              <!-- Header de la tarjeta -->
              <div class="d-flex justify-content-between align-items-start mb-4">
                <div class="icon-box">
                  <i class="bi bi-mortarboard-fill"></i>
                </div>
                <span class="type-badge">{{ curso.tipo_curso_nombre }}</span>
              </div>

              <!-- Título y descripción -->
              <h5 class="curso-title mb-2">{{ curso.nombre }}</h5>
              <p class="curso-desc text-muted mb-4">
                {{ curso.descripcion || 'Este curso está enfocado en el desarrollo de habilidades técnicas avanzadas.' }}
              </p>

              <!-- Footer de la tarjeta -->
              <div class="d-flex justify-content-between align-items-center mt-auto">
                <div class="stats-group">
                  <div class="stat-item">
                    <i class="bi bi-layers-half"></i>
                    <span>Gestión de Prácticas</span>
                  </div>
                </div>
                <div class="arrow-circle">
                  <i class="bi bi-arrow-right"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ESTADO VACÍO -->
      <div *ngIf="filteredCursos().length === 0" class="empty-state text-center py-5">
        <div class="icon-wrapper mb-4">
          <i class="bi bi-search"></i>
        </div>
        <h4>No se encontraron cursos</h4>
        <p class="text-muted">Intenta con otro término de búsqueda o verifica tus asignaciones.</p>
      </div>
    </div>
  `,
  styles: [`
    .management-container {
      padding: 2.5rem;
      max-width: 1600px;
      margin: 0 auto;
    }
    .fw-black { font-weight: 900; letter-spacing: -0.5px; }
    
    /* Buscador Moderno */
    .search-container {
      position: relative;
    }
    .search-icon {
      position: absolute;
      left: 1.25rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      font-size: 1.1rem;
    }
    .search-input {
      padding: 0.8rem 1rem 0.8rem 3rem;
      border-radius: 16px;
      border: 2px solid #e2e8f0;
      background: white;
      font-size: 0.95rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .search-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.1);
      outline: none;
    }

    /* Tarjeta Profesional */
    .curso-card-pro {
      position: relative;
      background: white;
      border-radius: 24px;
      padding: 2rem;
      cursor: pointer;
      overflow: hidden;
      height: 100%;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .curso-card-pro:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
      border-color: #3b82f6;
    }

    .card-glow {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: linear-gradient(90deg, #3b82f6, #2dd4bf);
      opacity: 0;
      transition: opacity 0.3s;
    }
    .curso-card-pro:hover .card-glow { opacity: 1; }

    .icon-box {
      width: 48px;
      height: 48px;
      background: #eff6ff;
      color: #3b82f6;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .type-badge {
      padding: 0.4rem 0.8rem;
      background: #f8fafc;
      color: #64748b;
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .curso-title {
      font-weight: 800;
      color: #1e293b;
      line-height: 1.3;
    }

    .curso-desc {
      font-size: 0.9rem;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 600;
    }

    .arrow-circle {
      width: 36px;
      height: 36px;
      background: #f1f5f9;
      color: #3b82f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      transition: all 0.3s ease;
    }
    .curso-card-pro:hover .arrow-circle {
      background: #3b82f6;
      color: white;
      transform: rotate(-45deg);
    }

    /* Estado Vacío */
    .empty-state .icon-wrapper {
      width: 100px;
      height: 100px;
      background: #f8fafc;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      color: #cbd5e1;
    }

    .animate-fade-in {
      animation: fadeIn 0.5s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class PracticaTecnicoCursoListComponent implements OnInit {
  private cursoService = inject(CursoService);
  private router = inject(Router);
  
  cursos = signal<any[]>([]);
  searchTerm = signal<string>('');

  filteredCursos = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.cursos();
    return this.cursos().filter(c => 
      c.nombre.toLowerCase().includes(term) || 
      (c.tipo_curso_nombre && c.tipo_curso_nombre.toLowerCase().includes(term))
    );
  });

  ngOnInit() {
    this.cursoService.getCursosPorTecnico().subscribe(data => {
      this.cursos.set(data);
    });
  }

  onCursoSelect(cursoId: number) {
    this.router.navigate(['/dashboard/mis-practicas-tecnico/gestion', cursoId]);
  }
}
