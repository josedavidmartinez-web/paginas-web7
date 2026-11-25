import { computed, inject, Injectable, signal } from '@angular/core';
import { Auth } from './auth';

export interface ServicioClinica {
  id: number;
  nombre: string;
  especialidad: 'Traumatología' | 'Ginecología' | 'Medicina General';
  especialista: string;
  precio: number;
  estado: 'Activo' | 'Agotado';
  actualizadoPor: string;
  actualizadoEn: string;
}

export type NuevoServicioClinica = Omit<
  ServicioClinica,
  'id' | 'actualizadoPor' | 'actualizadoEn'
>;

@Injectable({
  providedIn: 'root',
})
export class ServiciosClinica {
  private readonly auth = inject(Auth);
  private readonly storageKey = 'araucaria_servicios_crud';

  private readonly datosIniciales: ServicioClinica[] = [
    {
      id: 1,
      nombre: 'Consulta de Traumatología y Ortopedia',
      especialidad: 'Traumatología',
      especialista: 'Dr. Francisco Muñoz',
      precio: 750,
      estado: 'Activo',
      actualizadoPor: 'admin',
      actualizadoEn: '2026-11-20 10:00',
    },
    {
      id: 2,
      nombre: 'Consulta Ginecológica Integral',
      especialidad: 'Ginecología',
      especialista: 'Dra. Isabel Pérez Hernández',
      precio: 700,
      estado: 'Activo',
      actualizadoPor: 'admin',
      actualizadoEn: '2026-11-20 10:15',
    },
    {
      id: 3,
      nombre: 'Consulta de Medicina General',
      especialidad: 'Medicina General',
      especialista: 'Equipo Médico Araucaria',
      precio: 450,
      estado: 'Activo',
      actualizadoPor: 'admin',
      actualizadoEn: '2026-11-20 10:30',
    },
    {
      id: 4,
      nombre: 'Valoración de Lesiones Deportivas',
      especialidad: 'Traumatología',
      especialista: 'Dr. Francisco Muñoz',
      precio: 800,
      estado: 'Activo',
      actualizadoPor: 'admin',
      actualizadoEn: '2026-11-21 09:20',
    },
    {
      id: 5,
      nombre: 'Control Prenatal y Seguimiento',
      especialidad: 'Ginecología',
      especialista: 'Dra. Isabel Pérez Hernández',
      precio: 750,
      estado: 'Activo',
      actualizadoPor: 'admin',
      actualizadoEn: '2026-11-21 11:00',
    },
    {
      id: 6,
      nombre: 'Chequeo Preventivo General',
      especialidad: 'Medicina General',
      especialista: 'Equipo Médico Araucaria',
      precio: 500,
      estado: 'Activo',
      actualizadoPor: 'admin',
      actualizadoEn: '2026-11-22 16:40',
    },
  ];

  private readonly serviciosSignal = signal<ServicioClinica[]>(this.cargarInicial());
  readonly servicios = computed(() => this.serviciosSignal());

  crear(item: NuevoServicioClinica): ServicioClinica {
    const actual = this.serviciosSignal();
    const siguienteId =
      actual.length > 0 ? Math.max(...actual.map((s) => s.id)) + 1 : 1;

    const nuevo: ServicioClinica = {
      ...item,
      id: siguienteId,
      actualizadoPor: this.auth.username() ?? 'admin',
      actualizadoEn: this.fechaActual(),
    };

    const listaActualizada = [nuevo, ...actual];
    this.guardar(listaActualizada);
    return nuevo;
  }

  editar(id: number, cambios: NuevoServicioClinica): boolean {
    const actual = this.serviciosSignal();
    const existe = actual.some((s) => s.id === id);
    if (!existe) return false;

    const listaActualizada = actual.map((s) =>
      s.id === id
        ? {
            ...s,
            ...cambios,
            actualizadoPor: this.auth.username() ?? 'admin',
            actualizadoEn: this.fechaActual(),
          }
        : s
    );

    this.guardar(listaActualizada);
    return true;
  }

  eliminar(id: number): boolean {
    const actual = this.serviciosSignal();
    const filtrados = actual.filter((s) => s.id !== id);
    if (filtrados.length === actual.length) return false;

    this.guardar(filtrados);
    return true;
  }

  private cargarInicial(): ServicioClinica[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.datosIniciales));
        return this.datosIniciales;
      }
      const parsed = JSON.parse(raw) as ServicioClinica[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : this.datosIniciales;
    } catch {
      return this.datosIniciales;
    }
  }

  private guardar(lista: ServicioClinica[]): void {
    this.serviciosSignal.set(lista);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(lista));
    } catch {
      // Ignorar errores de cuota si ocurre
    }
  }

  private fechaActual(): string {
    const ahora = new Date();
    const fecha = ahora.toISOString().slice(0, 10);
    const hora = ahora.toTimeString().slice(0, 5);
    return `${fecha} ${hora}`;
  }
}