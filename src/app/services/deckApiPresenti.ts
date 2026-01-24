


//PER RECUPERARE TUTTI I CONTENUTI PRESETI SUL DB

//  this.api.getContenuti().subscribe({
//       next: (contenuti) => {
//         console.log('Contenuti ricevuti:', contenuti);
//       },
//       error: (err) => {
//         console.error('Errore nel recupero dei contenuti:', err);
//         this.error = err?.error?.message ?? 'Errore sconosciuto durante il recupero dei contenuti';
//       }
//     });

// INSERIMENTO DI UN GIOCO NEL DB

    // this.api.newContenuto('Titolo di esempio', 'Descrizione di esempio', 'Genere di esempio', 'http://linkdi.esempio', 'GIOCO', 2024, undefined, "PIPPO").subscribe({
    //   next: (res) => {
    //     console.log('Contenuto creato con ID:', res.id);
    //   },
    //   error: (err) => {
    //     console.error('Errore nella creazione del contenuto:', err);
    //     this.error = err?.error?.message ?? 'Errore sconosciuto durante la creazione del contenuto';
    //   }
    // });

// INSERIMENTO DI UN FILM NEL DB

    // this.api.newContenuto('Titolo di esempio', 'Descrizione di esempio', 'Genere di esempio', 'http://linkdi.esempio', 'FILM', 2024, "PIPPO" ).subscribe({
    //   next: (res) => {
    //     console.log('Contenuto creato con ID:', res.id);
    //   },
    //   error: (err) => {
    //     console.error('Errore nella creazione del contenuto:', err);
    //     this.error = err?.error?.message ?? 'Errore sconosciuto durante la creazione del contenuto';
    //   }
    // });

// INSERIMENTO DI UNA SERIE TV NEL DB

    //  this.api.newContenuto('Titolo di esempio', 'Descrizione di esempio', 'Genere di esempio', 'http://linkdi.esempio', 'SERIE_TV', 2024, undefined, undefined, false, 3).subscribe({
    //   next: (res) => {
    //     console.log('Contenuto creato con ID:', res.id);
    //   },
    //   error: (err) => {
    //     console.error('Errore nella creazione del contenuto:', err);
    //     this.error = err?.error?.message ?? 'Errore sconosciuto durante la creazione del contenuto';
    //   }
    // });

//AUTENTICAZIONE

    // this.api.authenticate(username, password).subscribe({
    //   next: (res) => {
    //     console.log('Login successful, token:', res.token);
    //     // Navigate to the main page or dashboard after successful login
    //     this.router.navigate(['/']);
    //   },
    //   error: (err) => {
    //     console.error('Login error:', err);
    //     this.error = err?.error?.message ?? 'Errore sconosciuto';
    //   }
    // });

//PROVE CHE NON SERVONO PIU'
    // this.api.getServerTime().subscribe({
    //   next: (res) => {
    //     // compatibile con il JSON { serverTime: { now: ... } }
    //     let pippo = (res.serverTime as any).now ?? JSON.stringify(res.serverTime);
    //     console.log('Server time from API:', pippo);
    //   },
    //   error: (err) => {
    //     this.error = err?.message ?? 'Errore sconosciuto';
    //     console.error('API error', err);
    //   }
    // });
    // this.api.getFirstUser().subscribe({
    //   next: (user) => {
    //     console.log('Primo utente:', user);
    //     let usergetter = user;
    //     console.log('Username del primo utente:', usergetter.username);
    //   },
    //   error: (err) => {
    //     console.error('Errore API:', err);
    //     this.error = err?.error?.message ?? 'Errore sconosciuto';
    //   }
    // });