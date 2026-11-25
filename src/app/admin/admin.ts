import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth } from '../services/auth';
import {
  NuevoServicioClinica,
  ServicioClinica,
  ServiciosClinica,
} from '../services/servicios-clinica';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-admin',
  styleUrl: './admin.css',
  templateUrl: './admin.html',
})
export class Admin {
  protected readonly auth = inject(Auth);
  private readonly serviciosService = inject(ServiciosClinica);
  private readonly fb = inject(FormBuilder);

  protected readonly busqueda = signal('');
  protected readonly filtroEspecialidad = signal<string>('TODAS');
  protected readonly editandoId = signal<number | null>(null);
  protected readonly confirmarEliminarId = signal<number | null>(null);
  protected readonly mensajeFeedback = signal<{
    tipo: 'success' | 'danger' | 'warning';
    texto: string;
  } | null>(null);

  protected readonly paginaActual = signal(1);
  protected readonly tamanioPagina = 4;

  protected readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(4)]],
    especialidad: [
      'Medicina General' as ServicioClinica['especialidad'],
      [Validators.required],
    ],
    especialista: ['', [Validators.required, Validators.minLength(3)]],
    precio: [500, [Validators.required, Validators.min(50)]],
    estado: ['Activo' as ServicioClinica['estado'], [Validators.required]],
  });

  protected readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const esp = this.filtroEspecialidad();

    return this.serviciosService.servicios().filter((item) => {
      const cumpleEsp = esp === 'TODAS' || item.especialidad === esp;
      const cumpleTexto =
        !texto ||
        item.nombre.toLowerCase().includes(texto) ||
        item.especialista.toLowerCase().includes(texto) ||
        item.especialidad.toLowerCase().includes(texto);

      return cumpleEsp && cumpleTexto;
    });
  });

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.filtrados().length / this.tamanioPagina))
  );

  protected readonly paginados = computed(() => {
    const pagina = Math.min(this.paginaActual(), this.totalPaginas());
    const inicio = (pagina - 1) * this.tamanioPagina;
    return this.filtrados().slice(inicio, inicio + this.tamanioPagina);
  });

  protected actualizarBusqueda(valor: string): void {
    this.busqueda.set(valor);
    this.paginaActual.set(1);
  }

  protected actualizarEspecialidad(valor: string): void {
    this.filtroEspecialidad.set(valor);
    this.paginaActual.set(1);
  }

  protected cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas()) {
      this.paginaActual.set(nuevaPagina);
    }
  }

  protected guardarRegistro(): void {
    this.mensajeFeedback.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.mensajeFeedback.set({
        tipo: 'warning',
        texto: 'Revisa los campos obligatorios antes de guardar.',
      });
      return;
    }

    const raw = this.formulario.getRawValue();
    const payload: NuevoServicioClinica = {
      nombre: raw.nombre.trim(),
      especialidad: raw.especialidad,
      especialista: raw.especialista.trim(),
      precio: Number(raw.precio),
      estado: raw.estado,
    };

    const idEditando = this.editandoId();

    if (idEditando !== null) {
      this.serviciosService.editar(idEditando, payload);
      this.mensajeFeedback.set({
        tipo: 'success',
        texto: `Servicio #${idEditando} actualizado correctamente.`,
      });
      this.cancelarEdicion();
    } else {
      const creado = this.serviciosService.crear(payload);
      this.mensajeFeedback.set({
        tipo: 'success',
        texto: `Servicio "${creado.nombre}" creado con ID #${creado.id}.`,
      });
      this.formulario.reset({
        nombre: '',
        especialidad: 'Medicina General',
        especialista: '',
        precio: 500,
        estado: 'Activo',
      });
      this.paginaActual.set(1);
    }
  }

  protected iniciarEdicion(servicio: ServicioClinica): void {
    this.editandoId.set(servicio.id);
    this.confirmarEliminarId.set(null);
    this.mensajeFeedback.set(null);

    this.formulario.setValue({
      nombre: servicio.nombre,
      especialidad: servicio.especialidad,
      especialista: servicio.especialista,
      precio: servicio.precio,
      estado: servicio.estado,
    });
  }

  protected cancelarEdicion(): void {
    this.editandoId.set(null);
    this.formulario.reset({
      nombre: '',
      especialidad: 'Medicina General',
      especialista: '',
      precio: 500,
      estado: 'Activo',
    });
  }

  protected solicitarEliminar(id: number): void {
    this.confirmarEliminarId.set(id);
  }

  protected cancelarEliminar(): void {
    this.confirmarEliminarId.set(null);
  }

  protected confirmarEliminar(id: number): void {
    const eliminado = this.serviciosService.eliminar(id);
    this.confirmarEliminarId.set(null);

    if (eliminado) {
      if (this.editandoId() === id) {
        this.cancelarEdicion();
      }
      if (this.paginaActual() > this.totalPaginas()) {
        this.paginaActual.set(this.totalPaginas());
      }
      this.mensajeFeedback.set({
        tipo: 'danger',
        texto: `Registro #${id} eliminado del panel.`,
      });
    }
  }
}