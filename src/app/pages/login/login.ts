import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly servicio = inject(Auth);
  private readonly router = inject(Router);

  protected readonly modoRegistro = signal(false);
  protected readonly mostrarPassword = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensajeExito = signal<string | null>(null);

  readonly formulario = new FormGroup({
    firstname: new FormControl('', { nonNullable: true }),
    lastname: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true }),
    usuario: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(4)],
    }),
  });

  protected cambiarModo(esRegistro: boolean): void {
    this.modoRegistro.set(esRegistro);
    this.error.set(null);
    this.mensajeExito.set(null);

    const { firstname, lastname, email, phone } = this.formulario.controls;

    if (esRegistro) {
      firstname.setValidators([Validators.required, Validators.minLength(2)]);
      lastname.setValidators([Validators.required, Validators.minLength(2)]);
      email.setValidators([Validators.required, Validators.email]);
      phone.setValidators([Validators.required, Validators.minLength(7)]);
    } else {
      firstname.clearValidators();
      lastname.clearValidators();
      email.clearValidators();
      phone.clearValidators();
    }

    firstname.updateValueAndValidity();
    lastname.updateValueAndValidity();
    email.updateValueAndValidity();
    phone.updateValueAndValidity();
    this.formulario.markAsUntouched();
  }

  protected togglePassword(): void {
    this.mostrarPassword.update((v) => !v);
  }

  invalido(
    campo: 'firstname' | 'lastname' | 'email' | 'phone' | 'usuario' | 'password'
  ): boolean {
    const control = this.formulario.controls[campo];
    return control.touched && control.invalid;
  }

  envio(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { firstname, lastname, email, phone, usuario, password } =
      this.formulario.getRawValue();

    this.loading.set(true);
    this.error.set(null);
    this.mensajeExito.set(null);

    if (this.modoRegistro()) {
      this.servicio
        .registrarUsuarioApi({
          firstname,
          lastname,
          email,
          phone,
          username: usuario,
          password,
        })
        .subscribe({
          next: () => {
            this.loading.set(false);
            this.mensajeExito.set(
              '¡Cuenta creada con éxito! Ya puedes iniciar sesión con tu usuario.'
            );
            this.cambiarModo(false);
            this.formulario.patchValue({ usuario, password: '' });
          },
          error: (err) => {
            this.loading.set(false);
            this.error.set(
              err?.message || 'No se pudo registrar el usuario en la API.'
            );
          },
        });
      return;
    }

    this.servicio.login(usuario, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/paciente']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err.status === 401
            ? 'Usuario o contraseña incorrectos.'
            : 'No se pudo iniciar sesión. Inténtalo de nuevo más tarde.'
        );
      },
    });
  }
}