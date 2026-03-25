import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IaService } from '../../../../services/ia.service';

@Component({
  selector: 'app-diagnostico-fallas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diagnostico-fallas.component.html',
  styleUrls: ['../styles/diagnostico-fallas.component.css']
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
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      }
    });
  }
}
