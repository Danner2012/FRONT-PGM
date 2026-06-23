import {
  Component,
  inject,
  signal,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IaService } from '../../../../services/ia.service';
import { Chart, registerables } from 'chart.js';

// Registrar Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-diagnostico-fallas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diagnostico-fallas.component.html',
  styleUrls: ['../styles/diagnostico-fallas.component.css']
})
export class DiagnosticoFallasComponent {

  private iaService = inject(IaService);

  @ViewChild('chartCanvas') chartRef!: ElementRef<HTMLCanvasElement>;
  chart: Chart | null = null;

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
          const data = res.diagnostico;
          this.diagnostico.set(data);


          setTimeout(() => {
            this.crearGrafico(data);
          }, 100);

        } else {
          this.error.set(true);
        }
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      }
    });
  }

  crearGrafico(data: any[]) {
    if (!this.chartRef) return;

    const labels = data.map(d => d.falla);
    const valores = data.map(d => d.probabilidad);

    // destruir gráfico anterior
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartRef.nativeElement.getContext('2d');
    let gradient: any = 'rgba(2, 158, 164, 0.8)';
    if (ctx) {
      gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, 'rgba(2, 158, 164, 0.85)');
      gradient.addColorStop(1, 'rgba(2, 158, 164, 0.15)');
    }

    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Probabilidad (%)',
          data: valores,
          borderWidth: 2,
          borderRadius: 10,
          backgroundColor: gradient,
          borderColor: '#029ea4',
          hoverBackgroundColor: '#017a7f'
        }]
      },
      options: {
        responsive: true,
        animation: {
          duration: 1200
        },
        plugins: {
          legend: {
            labels: {
              color: '#1e293b',
              font: {
                weight: 'bold'
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#64748b'
            },
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: '#64748b'
            },
            grid: {
              color: 'rgba(0,0,0,0.05)'
            }
          }
        }
      }
    });
  }
}