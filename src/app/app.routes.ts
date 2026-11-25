import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Nosotros } from './pages/nosotros/nosotros';
import { Productos } from './pages/productos/productos';
import { Login } from './pages/login/login';
import { Paciente } from './paciente/paciente';
import { Admin } from './admin/admin';
import { AgendarCita } from './pages/agendar-cita/agendar-cita';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full' },
  { path: 'nosotros', component: Nosotros },
  { path: 'productos', component: Productos },
  { path: 'login', component: Login },
  { path: 'agendar-cita', component: AgendarCita },
  { path: 'paciente', component: Paciente, canActivate: [authGuard] },
  { path: 'admin', component: Admin, canActivate: [authGuard] },
];