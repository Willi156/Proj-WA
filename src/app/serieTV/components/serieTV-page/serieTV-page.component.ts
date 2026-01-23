import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { SerieTv } from '../../model/serie-tv.model';
import {SerieSectionComponent} from '../serieTV-section/serieTV-section.component';

@Component({
  selector: 'app-serie-page',
  standalone: true,
  imports: [CommonModule, SerieSectionComponent],
  templateUrl: './serieTV-page.component.html',
  styleUrls: ['./serieTV-page.component.css']
})
export class SeriePageComponent implements OnInit {

  series: SerieTv[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getSerieTv().subscribe(series => {
      this.series = series;
    });
  }
}
