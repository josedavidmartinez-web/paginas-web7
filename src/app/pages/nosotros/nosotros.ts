import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-nosotros',
  styleUrl: './nosotros.css',
  templateUrl: './nosotros.html',
})
export class Nosotros {
  protected readonly valores = [
    {
      titulo: 'Simplicidad',
      descripcion:
        'Explicamos con claridad cada paso de tu atención para que te sientas tranquilo y informado.',
    },
    {
      titulo: 'Confianza',
      descripcion:
        'Cuidamos tu salud, tus datos y tus procesos médicos como si fueran los nuestros.',
    },
    {
      titulo: 'Colaboración',
      descripcion:
        'Escuchamos a nuestros pacientes y familias en cada consulta para brindar un cuidado cercano.',
    },
    {
      titulo: 'Mejora continua',
      descripcion:
        'Evolucionamos de forma constante para ofrecer diagnósticos y servicios cada vez más precisos.',
    },
  ];
}