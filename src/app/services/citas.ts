import { computed, inject, Injectable, signal } from '@angular/core';
import { Auth } from './auth';

export interface ItemCita {
  servicio: string;
  especialidad: 'Traumatología' | 'Ginecología' | 'Medicina General';
  cantidad: number;
  precioUnitario: number;
}

export interface CitaMedica {
  id: number;
  usuarioUsername: string;
  pacienteNombre: string;
  telefono: string;
  email: string;
  especialidad: 'Traumatología' | 'Ginecología' | 'Medicina General';
  servicio: string;
  fecha: string;
  hora: string;
  motivo: string;
  estado: 'Pendiente' | 'Confirmada' | 'Cancelada';
  creadaEn: string;
  // Campos solicitados por rúbrica: items[], subtotal, iva, total
  items: ItemCita[];
  subtotal: number;
  iva: number;
  total: number;
}

export type NuevaCitaPayload = Omit<
  CitaMedica,
  | 'id'
  | 'usuarioUsername'
  | 'estado'
  | 'creadaEn'
  | 'items'
  | 'subtotal'
  | 'iva'
  | 'total'
> & {
  precioUnitario?: number;
};

@Injectable({
  providedIn: 'root',
})
export class CitasService {
  private readonly auth = inject(Auth);
  private readonly storageKey = 'araucaria_citas_medicas';

  private readonly citasSignal = signal<CitaMedica[]>(this.cargarCitas());
  readonly citas = computed(() => this.citasSignal());

  readonly citasUsuarioActual = computed(() => {
    const user = this.auth.username()?.trim().toLowerCase();
    if (!user) return [];
    return this.citasSignal()
      .filter((c) => c.usuarioUsername.toLowerCase() === user)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  });

  agendarCita(datos: NuevaCitaPayload): CitaMedica {
    const actual = this.citasSignal();
    const siguienteId =
      actual.length > 0 ? Math.max(...actual.map((c) => c.id)) + 1 : 101;

    const precio = datos.precioUnitario ?? this.precioPorDefecto(datos.especialidad);
    const { subtotal, iva, total } = this.calcularTotales(precio, 1);

    const nueva: CitaMedica = {
      ...datos,
      id: siguienteId,
      usuarioUsername: this.auth.username() ?? 'invitado',
      estado: 'Pendiente',
      creadaEn: new Date().toISOString().slice(0, 16).replace('T', ' '),
      items: [
        {
          servicio: datos.servicio,
          especialidad: datos.especialidad,
          cantidad: 1,
          precioUnitario: precio,
        },
      ],
      subtotal,
      iva,
      total,
    };

    const actualizadas = [nueva, ...actual];
    this.guardar(actualizadas);
    return nueva;
  }

  editarCita(
    id: number,
    cambios: Partial<
      Pick<CitaMedica, 'fecha' | 'hora' | 'motivo' | 'servicio' | 'especialidad' | 'estado'>
    > & { precioUnitario?: number }
  ): boolean {
    const actual = this.citasSignal();
    const existe = actual.some((c) => c.id === id);
    if (!existe) return false;

    const actualizadas = actual.map((c) => {
      if (c.id !== id) return c;

      const especialidad = cambios.especialidad ?? c.especialidad;
      const servicio = cambios.servicio ?? c.servicio;
      const precio =
        cambios.precioUnitario ??
        c.items?.[0]?.precioUnitario ??
        this.precioPorDefecto(especialidad);
      const { subtotal, iva, total } = this.calcularTotales(precio, 1);

      return {
        ...c,
        ...cambios,
        especialidad,
        servicio,
        items: [
          {
            servicio,
            especialidad,
            cantidad: 1,
            precioUnitario: precio,
          },
        ],
        subtotal,
        iva,
        total,
      };
    });

    this.guardar(actualizadas);
    return true;
  }

  eliminarCita(id: number): boolean {
    const actual = this.citasSignal();
    const filtradas = actual.filter((c) => c.id !== id);
    if (filtradas.length === actual.length) return false;

    this.guardar(filtradas);
    return true;
  }

  cambiarEstado(id: number, estado: CitaMedica['estado']): void {
    const actualizadas = this.citasSignal().map((c) =>
      c.id === id ? { ...c, estado } : c
    );
    this.guardar(actualizadas);
  }

  calcularTotales(precioUnitario: number, cantidad = 1) {
    const subtotal = Number((precioUnitario * cantidad).toFixed(2));
    const iva = Number((subtotal * 0.16).toFixed(2));
    const total = Number((subtotal + iva).toFixed(2));
    return { subtotal, iva, total };
  }

  private precioPorDefecto(
    esp: 'Traumatología' | 'Ginecología' | 'Medicina General'
  ): number {
    if (esp === 'Traumatología') return 750;
    if (esp === 'Ginecología') return 700;
    return 450;
  }

  private cargarCitas(): CitaMedica[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CitaMedica[];
      // Normaliza registros antiguos que aún no tenían items/subtotal/iva/total
      return parsed.map((c) => {
        if (typeof c.total === 'number' && Array.isArray(c.items)) return c;
        const precio = this.precioPorDefecto(c.especialidad);
        const { subtotal, iva, total } = this.calcularTotales(precio, 1);
        return {
          ...c,
          items: [
            {
              servicio: c.servicio,
              especialidad: c.especialidad,
              cantidad: 1,
              precioUnitario: precio,
            },
          ],
          subtotal,
          iva,
          total,
        };
      });
    } catch {
      return [];
    }
  }

  private guardar(lista: CitaMedica[]): void {
    this.citasSignal.set(lista);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(lista));
    } catch {
      // Ignorar errores de almacenamiento
    }
  }
}