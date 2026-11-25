import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import emailjs from '@emailjs/browser';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-contactanos',
  styleUrl: './contactanos.css',
  templateUrl: './contactanos.html',
})
export class Contactanos {
  enviando = signal(false);
  mensajeExito = signal(false);
  mensajeError = signal(false);

  readonly formulario = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    correo: new FormControl('', [Validators.required, Validators.email]),
    numeroTelefono: new FormControl('', [Validators.required]),
    comentario: new FormControl('', [Validators.required, Validators.minLength(10)]),
  });

  invalido(nombre: string): boolean {
    const control = this.formulario.get(nombre);
    return !!control && control.touched && control.invalid;
  }

  invalidoC(correo: string): boolean {
    const control = this.formulario.get(correo);
    return !!control && control.touched && control.invalid;
  }

  invalidoNT(numeroTelefono: string): boolean {
    const control = this.formulario.get(numeroTelefono);
    return !!control && control.touched && control.invalid;
  }

  invalidoM(comentario: string): boolean {
    const control = this.formulario.get(comentario);
    return !!control && control.touched && control.invalid;
  }

  async envio(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.mensajeExito.set(false);
    this.mensajeError.set(false);

    try {
      await emailjs.send(
        'service_f552g8l',
        'template_nmw99bo',
        {
          nombre: this.formulario.value.nombre,
          correo: this.formulario.value.correo,
          numeroTelefono: this.formulario.value.numeroTelefono,
          comentario: this.formulario.value.comentario,
        },
        { publicKey: '_SB9krSNln8Mc-7-9' }
      );

      this.mensajeExito.set(true);
      this.formulario.reset();
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      this.mensajeError.set(true);
    } finally {
      this.enviando.set(false);
    }
  }
}
