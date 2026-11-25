import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { ServicioClinica, ServiciosClinica } from '../../services/servicios-clinica';

export interface ServicioMedico {
  id: number;
  categoria: string;
  titulo: string;
  especialista: string;
  descripcion: string;
  incluye: string[];
  precio: number;
  duracion: string;
  estado: 'Activo' | 'Agotado';
}

@Component({
  imports: [RouterLink],
  selector: 'app-productos',
  styleUrl: './productos.css',
  templateUrl: './productos.html',
})
export class Productos {
  protected readonly auth = inject(Auth);
  private readonly serviciosService = inject(ServiciosClinica);

  // Lee dinámicamente los servicios desde el CRUD de Admin (localStorage)
  protected readonly servicios = computed<ServicioMedico[]>(() =>
    this.serviciosService.servicios().map((item) => this.mapearServicio(item))
  );

  protected readonly servicioSeleccionado = signal<ServicioMedico | null>(null);

  protected verDetalles(servicio: ServicioMedico): void {
    this.servicioSeleccionado.set(servicio);
  }

  protected cerrarDetalles(): void {
    this.servicioSeleccionado.set(null);
  }

  private mapearServicio(item: ServicioClinica): ServicioMedico {
    return {
      id: item.id,
      categoria: item.especialidad,
      titulo: item.nombre,
      especialista: item.especialista,
      descripcion: `Atención médica profesional en ${item.especialidad} con ${item.especialista}.`,
      incluye: [
        'Valoración clínica personalizada',
        'Diagnóstico y plan de seguimiento',
        'Atención en instalaciones de Clínica Araucaria',
      ],
      precio: item.precio,
      duracion: item.estado === 'Activo' ? 'Disponible' : 'Sin cupo temporal',
      estado: item.estado,
    };
  }
}