import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SerieSectionComponent } from '../serieTV-section/serieTV-section.component';
import { MediaCacheService } from '../../../services/media-cache.service';
import { SerieTv } from '../../model/serie-tv.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-serie-page',
  standalone: true,
  imports: [CommonModule, SerieSectionComponent],
  templateUrl: './serieTV-page.component.html',
  styleUrls: ['./serieTV-page.component.css']
})
export class SeriePageComponent {
  series$!: Observable<{ newReleases: SerieTv[]; upcoming: SerieTv[]; best: SerieTv[] }>;

  constructor(private cache: MediaCacheService) {
    this.series$ = this.cache.series$.pipe(
      map((series: SerieTv[]) => ({
        newReleases: series.slice(0,5),
        upcoming:    series.slice(5,10),
        best:        series.slice(10,15),
      }))
    );
  }



}
