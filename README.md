# FitTrack

## O projektu
FitTrack je web aplikacija za pracenje treninga i napretka u teretani.

Aplikacija omogucava:
- registraciju i prijavu korisnika
- pretragu vezbi preko ExerciseDB API-ja
- kreiranje workout sablona
- pokretanje i pracenje workout sesija
- cuvanje setova, tezina i ponavljanja
- pregled istorije treninga i osnovnih statistika

Tehnologije koje su koriscene:
- Backend: Node.js, Express, Mongoose, JWT
- Frontend: React, TypeScript, React Router
- Baza: MongoDB Atlas
- HTTP klijent: Axios

## Preduslovi
Pre pokretanja potrebno je da budu instalirani:
- Node.js LTS (sa npm)
- Internet konekcija, zato sto backend koristi MongoDB Atlas i ExerciseDB API

Sve skripte pokretati kao administrator (Run as administrator).

## Konfiguracija
U repozitorijumu se nalazi fajl `server/.env.example`.

Potrebno je:
1. Preimenovati fajl `server/.env.example` u `server/.env`
2. Popuniti `MONGODB_URI` vrednost

Ostale vrednosti u `.env.example` su vec postavljene.

Za connection string javiti se na:
`krsticlazar@elfak.rs`

## Pokretanje projekta (prvi put)
1. Podesiti `server/.env`

Preimenovati fajl `server/.env.example` u `server/.env` i popuniti `MONGODB_URI`.

Za connection string javiti se na:
`krsticlazar@elfak.rs`

2. Pokrenuti `scripts\install-environment.cmd`

Skripta otvara dva administratorska CMD prozora:
- jedan ulazi u `server` i radi `npm install`
- drugi ulazi u `app` i radi `npm install`

Ako instalacija prodje uspesno, prozori se automatski zatvaraju.
Ako dodje do greske, prozor ostaje otvoren da moze da se vidi poruka.

3. Pokrenuti `scripts\start-project.cmd`

Skripta otvara dva administratorska CMD prozora:
- jedan ulazi u `server` i pokrece `npm run dev`
- drugi ulazi u `app` i pokrece `npm start`

## Adrese
Frontend: `http://localhost:3000`
API: `http://localhost:5000`
Health check: `http://localhost:5000/health`

## Sledeca pokretanja
Kada je projekat jednom podesen, za sledece pokretanje je u praksi dovoljno:

```cmd
scripts\start-project.cmd
```


## Test podaci
Ako je baza vec podesena i povezana preko dostavljenog `MONGODB_URI`, mogu da se koriste sledeci test nalozi:

1. Korisnik:
email: `marko@fittrack.com`
password: `password123`

2. Korisnik:
email: `ana@fittrack.com`
password: `password123`

## Napomena
Projekat je uradjen kao obaveza na predmetu Napredne baze podataka.
