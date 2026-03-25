import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IaService } from '../../../services/ia.service';

@Component({
  selector: 'app-diagnostico-fallas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid fade-in p-4">
      <!-- Encabezado -->
      <div class="header-section mb-5">
        <div class="d-flex align-items-center gap-3 mb-2">
          <div class="icon-orb">
            <i class="bi bi-robot"></i>
          </div>
          <div>
            <h2 class="title-tech m-0">Diagnóstico IA</h2>
            <p class="subtitle-tech m-0 text-muted">Red Neuronal MLP Multilabel • Asistencia Técnica</p>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <!-- Panel de Entrada de Síntomas -->
        <div class="col-lg-5">
          <div class="light-card p-4 h-100">
            <h5 class="section-title-tech mb-4"><i class="bi bi-terminal me-2"></i>Entrada de Datos</h5>
            
            <div class="input-wrapper-tech mb-4">
              <input type="text" 
                     class="form-control tech-input" 
                     placeholder="Describa un síntoma..." 
                     [(ngModel)]="nuevoSintoma" 
                     (keyup.enter)="agregarSintoma()">
              <button class="btn-add-tech" (click)="agregarSintoma()">
                <i class="bi bi-plus-lg"></i>
              </button>
            </div>

            <div class="tags-container mb-4">
              <div *ngFor="let s of sintomas(); let i = index" class="tech-tag animate-pop">
                <span>{{ s }}</span>
                <button (click)="removerSintoma(i)" class="btn-remove-tag">
                  <i class="bi bi-x"></i>
                </button>
              </div>
              <div *ngIf="sintomas().length === 0" class="empty-tags text-center py-4">
                <i class="bi bi-hash mb-2 d-block fs-2 text-muted opacity-25"></i>
                <p class="text-muted small">Sin síntomas registrados</p>
              </div>
            </div>

            <button class="btn-primary-tech w-100 mt-auto" 
                    [disabled]="sintomas().length === 0 || cargando()"
                    (click)="realizarDiagnostico()">
              <span *ngIf="!cargando()">
                <i class="bi bi-cpu-fill me-2"></i>PROCESAR CON MLP
              </span>
              <span *ngIf="cargando()">
                <span class="spinner-border spinner-border-sm me-2"></span>ANALIZANDO...
              </span>
            </button>
          </div>
        </div>

        <!-- Panel de Resultados -->
        <div class="col-lg-7">
          <div class="light-card p-4 h-100">
            <h5 class="section-title-tech mb-4"><i class="bi bi-bar-chart-fill me-2"></i>Predicciones del Modelo</h5>
            
            <!-- Estado Inicial -->
            <div *ngIf="!diagnostico() && !cargando() && !error()" class="empty-results py-5 text-center">
              <div class="pulse-circle mx-auto mb-4">
                <i class="bi bi-radar"></i>
              </div>
              <p class="text-muted">Esperando flujo de datos para análisis...</p>
            </div>

            <!-- Cargando Animación Tech -->
            <div *ngIf="cargando()" class="loading-tech py-5 text-center">
              <div class="scanning-bar mb-4"></div>
              <p class="text-primary fw-bold tracking-widest">CALCULANDO PROBABILIDADES...</p>
            </div>

            <!-- Lista de Resultados -->
            <div *ngIf="diagnostico()" class="results-grid animate-fade-in">
              <div *ngFor="let res of diagnostico()" class="prediction-card mb-3">
                <div class="prediction-info d-flex justify-content-between align-items-center mb-2">
                  <span class="falla-name">{{ res.falla }}</span>
                  <span class="falla-percent">{{ res.probabilidad }}%</span>
                </div>
                <div class="prediction-progress">
                  <div class="progress-fill" [style.width.%]="res.probabilidad"></div>
                </div>
              </div>
              
              <div class="info-footer mt-4">
                <i class="bi bi-info-square me-2"></i>
                <span>Precisión basada en el entrenamiento actual de la red neuronal.</span>
              </div>
            </div>

            <!-- Mensaje de Error -->
            <div *ngIf="error()" class="tech-alert error mt-3">
              <div class="d-flex align-items-center gap-3">
                <i class="bi bi-exclamation-octagon fs-4 text-danger"></i>
                <div>
                  <div class="fw-bold text-danger">Fallo de Enlace</div>
                  <div class="small text-danger opacity-75">No se puede contactar con el núcleo IA (Flask).</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { --accent: #3b82f6; --accent-soft: rgba(59, 130, 246, 0.08); }
    
    .title-tech { font-family: 'Orbitron', sans-serif; font-weight: 800; letter-spacing: 1px; color: #1e293b; }
    .subtitle-tech { font-size: 0.85rem; letter-spacing: 2px; text-transform: uppercase; color: #64748b; }
    
    .icon-orb {
      width: 50px; height: 50px; background: var(--accent);
      border-radius: 14px; display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; color: white; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    }

    .light-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      display: flex; flex-direction: column;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    }

    .section-title-tech {
      font-family: 'Orbitron', sans-serif; font-size: 0.9rem;
      color: #64748b; letter-spacing: 1px;
    }

    /* Input Design */
    .input-wrapper-tech {
      display: flex; background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 14px; overflow: hidden;
      transition: all 0.3s;
    }
    .input-wrapper-tech:focus-within { border-color: var(--accent); background: white; box-shadow: 0 0 0 4px var(--accent-soft); }
    
    .tech-input {
      background: transparent !important; border: none !important;
      color: #1e293b !important; padding: 12px 16px;
    }
    .btn-add-tech {
      background: var(--accent); border: none; color: white;
      padding: 0 16px; transition: 0.2s;
    }
    .btn-add-tech:hover { background: #2563eb; }

    /* Tags */
    .tech-tag {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--accent-soft); border: 1px solid rgba(59, 130, 246, 0.15);
      color: var(--accent); padding: 6px 14px; border-radius: 10px;
      font-size: 0.85rem; margin: 4px; font-weight: 600;
    }
    .btn-remove-tag {
      background: transparent; border: none; color: #ef4444;
      padding: 0; line-height: 1; font-size: 1.1rem; cursor: pointer;
    }

    /* Buttons */
    .btn-primary-tech {
      background: var(--accent); border: none; color: white;
      padding: 14px; border-radius: 14px; font-weight: 700;
      font-family: 'Orbitron', sans-serif; letter-spacing: 2px;
      transition: all 0.3s;
    }
    .btn-primary-tech:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(59, 130, 246, 0.25); }
    .btn-primary-tech:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Results Design */
    .prediction-card {
      background: #f8fafc; padding: 16px;
      border-radius: 16px; border: 1px solid #e2e8f0;
    }
    .falla-name { font-weight: 700; color: #334155; }
    .falla-percent { font-family: 'Orbitron', sans-serif; color: var(--accent); font-weight: 700; }
    
    .prediction-progress {
      height: 8px; background: #e2e8f0;
      border-radius: 10px; overflow: hidden; margin-top: 10px;
    }
    .progress-fill {
      height: 100%; background: linear-gradient(90deg, var(--accent), #60a5fa);
      border-radius: 10px; transition: width 1s ease-out;
    }

    .info-footer {
      font-size: 0.75rem; color: #94a3b8; font-style: italic;
      display: flex; align-items: center;
    }

    /* Animations & Loaders */
    .pulse-circle {
      width: 60px; height: 60px; border-radius: 50%;
      background: #f1f5f9; color: var(--accent);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.2); }
      70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
    }

    .scanning-bar {
      width: 100%; height: 3px; background: #e2e8f0;
      position: relative; overflow: hidden; border-radius: 2px;
    }
    .scanning-bar::after {
      content: ''; position: absolute; left: -100%; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, var(--accent), transparent);
      animation: scan 1.5s infinite;
    }
    @keyframes scan { 100% { left: 100%; } }

    .tech-alert.error {
      background: #fef2f2; border: 1px solid #fecaca;
      padding: 16px; border-radius: 16px;
    }

    .fade-in { animation: fadeIn 0.6s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-pop { animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
    @keyframes pop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .tracking-widest { letter-spacing: 0.2em; color: var(--accent); }
  `]
})
export class DiagnosticoFallasComponent {
  private iaService = inject(IaService);
  
  sintomas = signal<string[]>([]);
  nuevoSintoma = '';
  diagnostico = signal<any[] | null>(null);
  cargando = signal(false);
  error = signal<boolean>(false);

  agregarSintoma() {
    if (this.nuevoSintoma.trim()) {
      this.sintomas.update(list => [...list, this.nuevoSintoma.trim()]);
      this.nuevoSintoma = '';
    }
  }

  removerSintoma(index: number) {
    this.sintomas.update(list => list.filter((_, i) => i !== index));
  }

  realizarDiagnostico() {
    this.cargando.set(true);
    this.error.set(false);
    this.diagnostico.set(null);

    this.iaService.diagnosticar(this.sintomas()).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.diagnostico.set(res.diagnostico);
        } else {
          this.error.set(true);
        }
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(true);
        this.cargando.set(false);
      }
    });
  }
}
