export type MockKind = 'GAME' | 'MOVIE' | 'SERIES';

export type MockReview = {
  user: string;
  rating: number;
  comment: string;
  date: string;
};

export type MockContent = {
  id: number;
  kind: MockKind;
  title: string;
  year: number;
  genre: string;
  rating?: number;
  description: string;
  cover: string;
  reviews: MockReview[];
};

export const MOCK_CONTENT: MockContent[] = [
  {
    id: 5,
    kind: 'GAME',
    title: 'Grand Theft Auto V',
    year: 2013,
    genre: 'Action',
    rating: 8.2,
    description:
      'La trama principale di Grand Theft Auto V segue le avventure di tre protagonisti principali: Michael De Santa, Franklin Clinton e Trevor Philips. Ognuno di loro ha la propria storia e le proprie motivazioni, ma si uniscono in una serie di missioni che coinvolgono rapine audaci, sfide intense e una lotta costante per il potere e il denaro nella città immaginaria di The Saints. La storia si sviluppa attraverso 69 missioni, per un totale di circa 20 ore di gioco, e include anche numerosi dialoghi e eventi secondari.',
    cover: 'https://www.thegtaplace.com/images/gtav/artwork/v_michael4.jpg',
    reviews: [
      { user: 'Luca', rating: 8, comment: 'Divertente e enorme.', date: '12/01/2026' },
      { user: 'Sara', rating: 7, comment: 'Storia bella, online ok.', date: '10/01/2026' },
      { user: 'Marco', rating: 9, comment: 'Un classico.', date: '02/01/2026' },
      { user: 'Giulia', rating: 8, comment: 'Grafica Top!', date: '28/12/2025' },
      { user: 'Fede', rating: 7, comment: 'Sempre godibile.', date: '20/12/2025' },
    ],
  },
  {
    id: 6,
    kind: 'GAME',
    title: 'The Witcher 3: Wild Hunt',
    year: 2015,
    genre: 'Action RPG',
    rating: 7.3,
    description:
      'Un RPG open-world con scelte narrative, quest memorabili e un mondo ricco di dettagli.',
    cover: 'https://static1.srcdn.com/wordpress/wp-content/uploads/2023/05/the-witcher-wild-hunt-poster.jpg',
    reviews: [
      { user: 'Ale', rating: 10, comment: 'Capolavoro assoluto.', date: '08/01/2026' },
      { user: 'Marta', rating: 9, comment: 'Storia e personaggi incredibili.', date: '06/01/2026' },
    ],
  },
  {
    id: 101,
    kind: 'MOVIE',
    title: 'Inception',
    year: 2010,
    genre: 'Sci-Fi',
    rating: 8.7,
    description:
      'Un thriller sci-fi sui sogni, con livelli di realtà e un colpo impossibile.',
    cover: 'https://m.media-amazon.com/images/I/91zN1kqG0GL._AC_SL1500_.jpg',
    reviews: [
      { user: 'Vale', rating: 9, comment: 'Mindblowing.', date: '05/01/2026' },
    ],
  },
  {
    id: 201,
    kind: 'SERIES',
    title: 'Breaking Bad',
    year: 2008,
    genre: 'Drama',
    rating: 9.5,
    description:
      'Un professore di chimica entra nel mondo della droga. Una discesa perfetta.',
    cover: 'https://m.media-amazon.com/images/I/81QG3Vv+qXL._AC_SL1500_.jpg',
    reviews: [],
  },
];

export function findMockContent(kind: MockKind, id: number): MockContent | null {
  return MOCK_CONTENT.find((c) => c.kind === kind && c.id === id) ?? null;
}
