import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth, UsuarioPerfil } from '../services/auth';
import { CitaMedica, CitasService } from '../services/citas';

@Component({
  imports: [RouterLink, ReactiveFormsModule],
  selector: 'app-paciente',
  styleUrl: './paciente.css',
  templateUrl: './paciente.html',
})
export class Paciente implements OnInit {
  protected readonly auth = inject(Auth);
  protected readonly citasService = inject(CitasService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly perfil = signal<UsuarioPerfil | null>(null);
  protected readonly cargando = signal(true);

  // Filtros y ordenamiento del historial (Rúbrica: filtrado y ordenamiento por fecha)
  protected readonly filtroFecha = signal<string>('');
  protected readonly ordenFecha = signal<'desc' | 'asc'>('desc');

  // Estado para edición y feedback
  protected readonly editandoCitaId = signal<number | null>(null);
  protected readonly mensajeHistorial = signal<string | null>(null);

  protected readonly horariosDisponibles = [
    '09:00 AM',
    '10:00 AM',
    '11:30 AM',
    '01:00 PM',
    '04:00 PM',
    '05:30 PM',
    '07:00 PM',
  ];

  protected readonly formEdicion = this.fb.nonNullable.group({
    fecha: ['', [Validators.required]],
    hora: ['', [Validators.required]],
    motivo: ['', [Validators.maxLength(300)]],
  });

  protected readonly nombreCompleto = computed(() => {
    const p = this.perfil();
    if (!p) {
      return this.auth.username() ?? 'Paciente';
    }
    return `${p.name.firstname} ${p.name.lastname}`.trim();
  });

  // Arreglo filtrado y ordenado de citas del paciente
  protected readonly citasFiltradas = computed(() => {
    const fecha = this.filtroFecha().trim();
    const orden = this.ordenFecha();

    return this.citasService
      .citasUsuarioActual()
      .filter((c) => !fecha || c.fecha === fecha)
      .sort((a, b) =>
        orden === 'desc'
          ? b.fecha.localeCompare(a.fecha)
          : a.fecha.localeCompare(b.fecha)
      );
  });

  // Cálculo acumulado de Subtotal, IVA (16%) y Total del historial filtrado
  protected readonly resumenFinanciero = computed(() => {
    const lista = this.citasFiltradas();
    const subtotal = lista.reduce((acc, c) => acc + (c.subtotal ?? 0), 0);
    const iva = lista.reduce((acc, c) => acc + (c.iva ?? 0), 0);
    const total = lista.reduce((acc, c) => acc + (c.total ?? 0), 0);
    return {
      subtotal: Number(subtotal.toFixed(2)),
      iva: Number(iva.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  });

  ngOnInit(): void {
    this.auth.obtenerPerfilUsuario().subscribe({
      next: (datos) => {
        this.perfil.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }

  protected cambiarFiltroFecha(fecha: string): void {
    this.filtroFecha.set(fecha);
  }

  protected limpiarFiltro(): void {
    this.filtroFecha.set('');
  }

  protected cambiarOrden(orden: string): void {
    this.ordenFecha.set(orden === 'asc' ? 'asc' : 'desc');
  }

  protected iniciarEdicion(cita: CitaMedica): void {
    this.editandoCitaId.set(cita.id);
    this.mensajeHistorial.set(null);
    this.formEdicion.setValue({
      fecha: cita.fecha,
      hora: cita.hora,
      motivo: cita.motivo,
    });
  }

  protected cancelarEdicion(): void {
    this.editandoCitaId.set(null);
  }

  protected guardarEdicion(id: number): void {
    if (this.formEdicion.invalid) {
      this.formEdicion.markAllAsTouched();
      return;
    }

    const raw = this.formEdicion.getRawValue();
    this.citasService.editarCita(id, {
      fecha: raw.fecha,
      hora: raw.hora,
      motivo: raw.motivo.trim() || 'Consulta general programada',
    });

    this.editandoCitaId.set(null);
    this.mensajeHistorial.set(`Cita #${id} actualizada correctamente.`);
  }

  protected eliminarCita(id: number): void {
    this.citasService.eliminarCita(id);
    if (this.editandoCitaId() === id) {
      this.editandoCitaId.set(null);
    }
    this.mensajeHistorial.set(`Cita #${id} eliminada del historial.`);
  }

  protected cerrarSesion(): void {
    this.auth.logouth();
    this.router.navigate(['/login']);
  }
}