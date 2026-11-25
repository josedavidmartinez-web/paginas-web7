import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './navbar/navbar';
import { Footer } from './shared/footer/footer'; // Verifica que la ruta coincida con donde lo creaste

@Component({
  imports: [RouterOutlet, Navbar, Footer],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('proyecto_web');
}