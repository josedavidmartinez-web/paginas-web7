import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { CitaMedica, CitasService } from '../../services/citas';
import { ServiciosClinica } from '../../services/servicios-clinica';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-agendar-cita',
  styleUrl: './agendar-cita.css',
  templateUrl: './agendar-cita.html',
})
export class AgendarCita implements OnInit {
  protected readonly auth = inject(Auth);
  private readonly citasService = inject(CitasService);
  private readonly serviciosService = inject(ServiciosClinica);
  private readonly fb = inject(FormBuilder);

  protected readonly citaConfirmada = signal<CitaMedica | null>(null);
  protected readonly especialidadSeleccionada = signal<
    'Traumatología' | 'Ginecología' | 'Medicina General'
  >('Medicina General');

  protected readonly fechaMinima = new Date().toISOString().slice(0, 10);

  protected readonly horariosDisponibles = [
    '09:00 AM',
    '10:00 AM',
    '11:30 AM',
    '01:00 PM',
    '04:00 PM',
    '05:30 PM',
    '07:00 PM',
  ];

  // Toma los servicios activos directamente desde tu catálogo del CRUD
  protected readonly serviciosFiltrados = computed(() => {
    const esp = this.especialidadSeleccionada();
    return this.serviciosService
      .servicios()
      .filter((s) => s.especialidad === esp && s.estado === 'Activo');
  });

  protected readonly formulario = this.fb.nonNullable.group({
    pacienteNombre: ['', [Validators.required, Validators.minLength(4)]],
    telefono: ['', [Validators.required, Validators.minLength(8)]],
    email: ['', [Validators.required, Validators.email]],
    especialidad: [
      'Medicina General' as 'Traumatología' | 'Ginecología' | 'Medicina General',
      [Validators.required],
    ],
    servicio: ['', [Validators.required]],
    fecha: ['', [Validators.required]],
    hora: ['10:00 AM', [Validators.required]],
    motivo: ['', [Validators.maxLength(300)]],
  });

  ngOnInit(): void {
    this.seleccionarPrimerServicio('Medicina General');

    // Si el usuario tiene sesión iniciada, pre-llenamos sus datos
    if (this.auth.isAuthenticated()) {
      this.auth.obtenerPerfilUsuario().subscribe((perfil) => {
        if (perfil) {
          this.formulario.patchValue({
            pacienteNombre: `${perfil.name.firstname} ${perfil.name.lastname}`.trim(),
            email: perfil.email,
            telefono: perfil.phone,
          });
        }
      });
    }
  }

  protected alCambiarEspecialidad(valor: string): void {
    const esp = valor as 'Traumatología' | 'Ginecología' | 'Medicina General';
    this.especialidadSeleccionada.set(esp);
    this.seleccionarPrimerServicio(esp);
  }

  protected enviarCita(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const raw = this.formulario.getRawValue();
    const servicioEncontrado = this.serviciosService
      .servicios()
      .find((s) => s.nombre === raw.servicio);

    const creada = this.citasService.agendarCita({
      pacienteNombre: raw.pacienteNombre.trim(),
      telefono: raw.telefono.trim(),
      email: raw.email.trim(),
      especialidad: raw.especialidad,
      servicio: raw.servicio,
      fecha: raw.fecha,
      hora: raw.hora,
      motivo: raw.motivo.trim() || 'Consulta general programada',
      precioUnitario: servicioEncontrado?.precio,
    });

    this.citaConfirmada.set(creada);
  }

  protected agendarOtra(): void {
    this.citaConfirmada.set(null);
    this.formulario.patchValue({
      fecha: '',
      motivo: '',
    });
  }

  private seleccionarPrimerServicio(
    esp: 'Traumatología' | 'Ginecología' | 'Medicina General'
  ): void {
    const primero = this.serviciosService
      .servicios()
      .find((s) => s.especialidad === esp && s.estado === 'Activo');
    this.formulario.patchValue({
      servicio: primero ? primero.nombre : `Consulta de ${esp}`,
    });
  }
}