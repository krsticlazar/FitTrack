# FitTrack - Web Aplikacija za Praćenje Vežbi

FitTrack je moderna web aplikacija za praćenje treninga i napretka u teretani. Korisnici mogu kreirati personalizovane workout šablone koristeći eksternu bazu vežbi, logirati svoje sesije treninga sa detaljima o težini i ponavljanjima, i pratiti svoj napredak tokom vremena.

## 🎯 Funkcionalnosti

- **Autentifikacija korisnika** - Registracija i login sa JWT tokenima
- **Eksterna baza vežbi** - Integracija sa ExerciseDB API-jem za pristup bazi od 1000+ vežbi
- **Workout Templates** - Kreiranje personalizovanih šablona treninga
- **Workout Sessions** - Logovanje realnih sesija treninga sa detaljima o setovima
- **Praćenje napretka** - Uvid u istoriju treninga, volumene i rekorde
- **Fleksibilna MongoDB šema** - Prilagođena struktura za različite tipove vežbi

## 🏗️ Tehnologije

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL baza podataka (MongoDB Atlas)
- **Mongoose** - ODM za MongoDB
- **JWT** - Autentifikacija

### Frontend
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Axios** - HTTP client
- **React Router** - Navigacija

## 📁 Struktura Projekta

```
FitTrack/
├── server/
│   ├── db/              # MongoDB konekcija
│   ├── middleware/      # Auth middleware
│   ├── routes/          # API rute
│   ├── utils/           # Pomoćne funkcije
│   └── index.js         # Server entry point
├── app/
│   ├── src/
│   │   ├── components/  # React komponente
│   │   ├── context/     # Context API
│   │   ├── pages/       # Stranice
│   │   ├── services/    # API servisi
│   │   └── App.tsx      # Root komponenta
│   └── public/
└── .env                 # Environment varijable
```

## 📊 MongoDB Modeli

### User
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  createdAt: Date
}
```

### WorkoutTemplate
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  name: String,
  exercises: [
    {
      exerciseId: String,
      name: String,
      gifUrl: String,
      targetMuscles: [String],
      sets: Number,
      defaultWeight: Number
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### WorkoutSession
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  templateId: ObjectId (ref: WorkoutTemplate),
  templateName: String,
  status: String (active/completed),
  startTime: Date,
  endTime: Date,
  exercises: [
    {
      exerciseId: String,
      name: String,
      sets: [
        {
          setNumber: Number,
          weight: Number,
          reps: Number,
          isPersonalRecord: Boolean
        }
      ]
    }
  ],
  totalVolume: Number,
  duration: Number,
  notes: String
}
```

## 🚀 Instalacija i Pokretanje

### Preduslovi
- Node.js (v14 ili noviji)
- npm ili yarn
- MongoDB Shell (mongosh) - za inicijalizaciju baze

### 1. Instalacija zavisnosti

```bash
# U root direktorijumu
npm install

# U app direktorijumu
cd app
npm install
cd ..
```

**ILI** koristi skriptu:
```bash
npm run install-all
```

### 2. Environment Setup

Fajl `.env` je već kreiran sa MongoDB Atlas connection stringom. Ako želite da koristite drugu bazu, promenite `MONGODB_URI`.

### 3. Inicijalizacija Baze Podataka

**VAŽNO:** Pre prvog pokretanja, potrebno je popuniti bazu sa test podacima.

```bash
# Linux/Mac
./init-database.sh

# Windows (ručno)
mongosh "mongodb+srv://fittrack:84M0IBhBVxfn2ltb@cluster0.0p7cyw3.mongodb.net/fittrack" --file server/db/init-db.js
```

Ovo će kreirati:
- 2 test korisnika (marko i ana)
- 4 workout template-a
- 4 workout session-a (uključujući 1 aktivnu sesiju)
- Sve potrebne indekse

**Test nalozi:**
- Email: `marko@fittrack.com` | Password: `password123`
- Email: `ana@fittrack.com` | Password: `password123`

### 4. Pokretanje Aplikacije

#### Pokreni Backend (Terminal 1)

```bash
# Development mod sa auto-reload
npm run dev

# Ili production
npm start
```

Server će biti dostupan na `http://localhost:5000`

#### Pokreni Frontend (Terminal 2)

```bash
cd app
npm start
```

React aplikacija će biti dostupna na `http://localhost:3000`

### 5. Provera Funkcionalnosti

1. Otvori `http://localhost:3000`
2. Klikni na "Prijavi se"
3. Koristi test nalog: `marko@fittrack.com` / `password123`
4. Istraži aplikaciju:
   - **Početna**: Vidi statistike i istoriju
   - **Vežbe**: Pretraži bazu vežbi po mišićnim grupama
   - **Moji Treninzi**: Vidi šablone i pokreni sesiju

## 📋 Verifikacija MongoDB Konekcije

Možete testirati konekciju i videti podatke u MongoDB Atlas:

```bash
# Konektuj se na bazu
mongosh "mongodb+srv://fittrack:84M0IBhBVxfn2ltb@cluster0.0p7cyw3.mongodb.net/fittrack"

# Komande za proveru
use fittrack
show collections
db.users.find().pretty()
db.workouttemplates.find().pretty()
db.workoutsessions.find().pretty()
```

## 🛠️ Development Scripts

```bash
# Root direktorijum
npm run dev          # Pokreni server sa nodemon
npm start            # Pokreni server u production modu
npm run client       # Pokreni samo React app
npm run install-all  # Instaliraj sve zavisnosti

# App direktorijum (cd app)
npm start            # Development server
npm run build        # Build za production
npm test             # Pokreni testove
```

## 🔌 API Endpoints

### Auth
- `POST /api/auth/register` - Registracija korisnika
- `POST /api/auth/login` - Login korisnika
- `GET /api/auth/me` - Provera autentifikacije

### Exercise (External API Proxy)
- `GET /api/exercises/search?name=...` - Pretraga vežbi po imenu
- `GET /api/exercises/bodypart/:bodypart` - Vežbe po mišićnoj grupi
- `GET /api/exercises/:id` - Detalji o vežbi

### Workout Templates
- `GET /api/templates` - Lista svih šablona korisnika
- `POST /api/templates` - Kreiranje novog šablona
- `GET /api/templates/:id` - Detalji šablona
- `PUT /api/templates/:id` - Izmena šablona
- `DELETE /api/templates/:id` - Brisanje šablona

### Workout Sessions
- `GET /api/sessions` - Lista svih sesija korisnika
- `POST /api/sessions` - Pokretanje nove sesije
- `GET /api/sessions/active` - Trenutno aktivna sesija
- `PUT /api/sessions/:id` - Ažuriranje sesije
- `POST /api/sessions/:id/complete` - Završavanje sesije
- `DELETE /api/sessions/:id` - Brisanje sesije

### Stats
- `GET /api/stats/overview` - Opšte statistike
- `GET /api/stats/exercise/:exerciseId` - Statistika za vežbu (rekord)
- `GET /api/stats/history` - Istorija treninga

## 🗄️ MongoDB Konekcija

Aplikacija koristi MongoDB Atlas cloud rešenje. Connection string se nalazi u `.env` fajlu.

## 🔐 Autentifikacija

Aplikacija koristi JWT (JSON Web Token) za autentifikaciju. Token se čuva u localStorage na frontendu i šalje u Authorization header-u za svaki zaštićeni API poziv.

## 📝 Napomene za Projekat

- **Hibridni pristup modeliranja** - Kombinacija ugnježdenih dokumenata i referenci
- **Indeksi** - Kreirati indekse na `userId`, `templateId`, `status` za optimizaciju
- **Validacija** - Mongoose schema validation sa custom validatorima
- **Agregacija** - Korišćenje Aggregation Framework za statistike i analitiku
- **TTL indeksi** - Za automatsko brisanje starih sesija ako je potrebno

## 👨‍💻 Autor

Projekat za kurs Napredne Baze Podataka
