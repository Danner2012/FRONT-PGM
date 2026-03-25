import { Component, signal, inject, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

interface CircuitPath {
  points: {x: number, y: number}[];
  opacity: number;
  pulsePos: number;
  speed: number;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['../styles/login.component.css']
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private ctx!: CanvasRenderingContext2D;
  private paths: CircuitPath[] = [];
  private animationId!: number;

  loginForm: FormGroup = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    clave: ['', Validators.required]
  });

  errorMessage = signal<string | null>(null);
  isLoading = signal(false);
  showPassword = signal(false); // Signal para visibilidad de contraseña

  ngAfterViewInit() {
    this.initCircuit();
  }

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', () => this.resizeCanvas());
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  initCircuit() {
    const canvas = this.canvas.nativeElement;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    this.ctx = context;
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.paths = [];
    for(let i=0; i<25; i++) {
      this.paths.push(this.createPath());
    }
    this.animate();
  }

  createPath(): CircuitPath {
    const canvas = this.canvas.nativeElement;
    let x = Math.random() * canvas.width;
    let y = Math.random() * canvas.height;
    const points = [{x, y}];
    
    const segments = 3 + Math.floor(Math.random() * 4);
    for(let i=0; i<segments; i++) {
      const angle = (Math.floor(Math.random() * 8) * Math.PI) / 4;
      const len = 60 + Math.random() * 120;
      x += Math.cos(angle) * len;
      y += Math.sin(angle) * len;
      points.push({x, y});
    }

    return {
      points,
      opacity: 0.1 + Math.random() * 0.5,
      pulsePos: Math.random(), 
      speed: 0.003 + Math.random() * 0.008
    };
  }

  resizeCanvas() {
    const canvas = this.canvas.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  animate() {
    const canvas = this.canvas.nativeElement;
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.paths.forEach((path, index) => {
      this.ctx.beginPath();
      this.ctx.moveTo(path.points[0].x, path.points[0].y);
      for(let i=1; i<path.points.length; i++) {
        this.ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      this.ctx.strokeStyle = `rgba(59, 130, 246, ${path.opacity * 0.25})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();

      this.drawPulse(path);

      path.pulsePos += path.speed;
      if (path.pulsePos >= 1) {
        this.paths[index] = this.createPath();
        this.paths[index].pulsePos = 0;
      }
    });

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  drawPulse(path: CircuitPath) {
    const totalSegments = path.points.length - 1;
    const currentProgress = path.pulsePos * totalSegments;
    const segmentIdx = Math.floor(currentProgress);
    const segmentProgress = currentProgress % 1;

    if (segmentIdx < totalSegments) {
      const p1 = path.points[segmentIdx];
      const p2 = path.points[segmentIdx + 1];
      const x = p1.x + (p2.x - p1.x) * segmentProgress;
      const y = p1.y + (p2.y - p1.y) * segmentProgress;

      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = '#60a5fa';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      this.ctx.beginPath();
      this.ctx.arc(x, y, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(96, 165, 250, 0.3)';
      this.ctx.fill();
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          setTimeout(() => {
            this.isLoading.set(false);
            this.router.navigate(['/dashboard']);
          }, 600);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.error || 'Credenciales no válidas');
        }
      });
    }
  }
}
