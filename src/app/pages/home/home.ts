import { Component } from '@angular/core';
import { Hero } from '../../hero/hero';
import { Contactanos } from '../../contactanos/contactanos';

@Component({
  imports: [Hero,Contactanos],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {}
