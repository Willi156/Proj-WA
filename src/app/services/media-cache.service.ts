import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';
import {SerieTv} from '../serieTV/model/serie-tv.model';
import {Film} from '../film/model/film.model';
import {Game} from '../games/models/game.model';

@Injectable({ providedIn: 'root' })
export class MediaCacheService {

  games$!: Observable<Game[]>;
  films$!: Observable<Film[]>;
  series$!: Observable<SerieTv[]>;

  constructor(private api: ApiService) {
    this.games$ = this.api.getGiochi().pipe(shareReplay(1));
    this.films$ = this.api.getFilm().pipe(shareReplay(1));
    this.series$ = this.api.getSerieTv().pipe(shareReplay(1));

    this.games$.subscribe();
    this.films$.subscribe();
    this.series$.subscribe();
  }
}


