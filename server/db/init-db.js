// MongoDB Initialization Script za FitTrack aplikaciju
// Ova skripta popunjava bazu sa test podacima
// 
// Pokretanje:
// mongosh "mongodb+srv://fittrack:84M0IBhBVxfn2ltb@cluster0.0p7cyw3.mongodb.net/fittrack" < init-db.js
//
// Ili direktno u mongosh:
// load('init-db.js')

print("=== FitTrack Database Initialization ===\n");

// Koristi fittrack bazu
use fittrack;

print("1. Brisanje postojećih kolekcija...");
db.users.drop();
db.workouttemplates.drop();
db.workoutsessions.drop();

print("2. Kreiranje kolekcija...\n");

// ===== USERS =====
print("3. Kreiranje korisnika...");

// Napomena: password je hashovan sa bcrypt
// Original password: "password123"
// Hash generisan sa: bcrypt.hashSync("password123", 10)
const testUserPassword = "$2a$10$YourHashedPasswordHere"; // Zameniti sa pravim hash-om

const user1 = db.users.insertOne({
  username: "marko",
  email: "marko@fittrack.com",
  password: "$2a$10$YourHashedPasswordHere", // password123
  createdAt: new Date(),
  updatedAt: new Date()
});

const user2 = db.users.insertOne({
  username: "ana",
  email: "ana@fittrack.com",
  password: "$2a$10$YourHashedPasswordHere", // password123
  createdAt: new Date(),
  updatedAt: new Date()
});

print(`   ✓ Kreirano ${db.users.countDocuments()} korisnika`);

// ===== WORKOUT TEMPLATES =====
print("\n4. Kreiranje workout templates...");

const pushTemplate = db.workouttemplates.insertOne({
  userId: user1.insertedId,
  name: "Push Day - Grudi i Ramena",
  description: "Fokus na grudne mišiće, prednje i bočne delte, triceps",
  exercises: [
    {
      exerciseId: "7F1DVzn",
      name: "Bench Press",
      gifUrl: "https://static.exercisedb.dev/media/7F1DVzn.gif",
      targetMuscles: ["chest"],
      bodyParts: ["chest"],
      equipments: ["barbell"],
      sets: 4,
      defaultWeight: 60,
      order: 0
    },
    {
      exerciseId: "dmgMp3n",
      name: "Incline Dumbbell Press",
      gifUrl: "https://static.exercisedb.dev/media/dmgMp3n.gif",
      targetMuscles: ["upper chest"],
      bodyParts: ["chest"],
      equipments: ["dumbbell"],
      sets: 4,
      defaultWeight: 30,
      order: 1
    },
    {
      exerciseId: "JGKowMS",
      name: "Shoulder Press",
      gifUrl: "https://static.exercisedb.dev/media/JGKowMS.gif",
      targetMuscles: ["shoulders"],
      bodyParts: ["shoulders"],
      equipments: ["barbell"],
      sets: 3,
      defaultWeight: 40,
      order: 2
    },
    {
      exerciseId: "8d8qJQI",
      name: "Lateral Raises",
      gifUrl: "https://static.exercisedb.dev/media/8d8qJQI.gif",
      targetMuscles: ["shoulders"],
      bodyParts: ["shoulders"],
      equipments: ["dumbbell"],
      sets: 3,
      defaultWeight: 12,
      order: 3
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
});

const pullTemplate = db.workouttemplates.insertOne({
  userId: user1.insertedId,
  name: "Pull Day - Leđa i Biceps",
  description: "Fokus na širinu i debljinu leđa, zadnje delte, biceps",
  exercises: [
    {
      exerciseId: "72BC5Za",
      name: "Pull-ups",
      gifUrl: "https://static.exercisedb.dev/media/72BC5Za.gif",
      targetMuscles: ["lats"],
      bodyParts: ["back"],
      equipments: ["body weight"],
      sets: 4,
      defaultWeight: 0,
      order: 0
    },
    {
      exerciseId: "dmgMp3n",
      name: "Barbell Row",
      gifUrl: "https://static.exercisedb.dev/media/dmgMp3n.gif",
      targetMuscles: ["upper back"],
      bodyParts: ["back"],
      equipments: ["barbell"],
      sets: 4,
      defaultWeight: 50,
      order: 1
    },
    {
      exerciseId: "7F1DVzn",
      name: "Lat Pulldown",
      gifUrl: "https://static.exercisedb.dev/media/7F1DVzn.gif",
      targetMuscles: ["lats"],
      bodyParts: ["back"],
      equipments: ["cable"],
      sets: 3,
      defaultWeight: 45,
      order: 2
    },
    {
      exerciseId: "VPPtusI",
      name: "Bicep Curls",
      gifUrl: "https://static.exercisedb.dev/media/VPPtusI.gif",
      targetMuscles: ["biceps"],
      bodyParts: ["upper arms"],
      equipments: ["dumbbell"],
      sets: 3,
      defaultWeight: 15,
      order: 3
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
});

const legTemplate = db.workouttemplates.insertOne({
  userId: user1.insertedId,
  name: "Leg Day - Noge",
  description: "Kompletan trening nogu - kvadriceps, hamstrings, gluteus",
  exercises: [
    {
      exerciseId: "ZZTGMKh",
      name: "Squat",
      gifUrl: "https://static.exercisedb.dev/media/ZZTGMKh.gif",
      targetMuscles: ["quadriceps"],
      bodyParts: ["upper legs"],
      equipments: ["barbell"],
      sets: 5,
      defaultWeight: 80,
      order: 0
    },
    {
      exerciseId: "72BC5Za",
      name: "Romanian Deadlift",
      gifUrl: "https://static.exercisedb.dev/media/72BC5Za.gif",
      targetMuscles: ["hamstrings"],
      bodyParts: ["upper legs"],
      equipments: ["barbell"],
      sets: 4,
      defaultWeight: 60,
      order: 1
    },
    {
      exerciseId: "VPPtusI",
      name: "Leg Press",
      gifUrl: "https://static.exercisedb.dev/media/VPPtusI.gif",
      targetMuscles: ["quadriceps"],
      bodyParts: ["upper legs"],
      equipments: ["machine"],
      sets: 4,
      defaultWeight: 120,
      order: 2
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
});

// Template za drugog korisnika
const fullBodyTemplate = db.workouttemplates.insertOne({
  userId: user2.insertedId,
  name: "Full Body Workout",
  description: "Trening celog tela za početnike",
  exercises: [
    {
      exerciseId: "ZZTGMKh",
      name: "Squat",
      gifUrl: "https://static.exercisedb.dev/media/ZZTGMKh.gif",
      targetMuscles: ["quadriceps"],
      bodyParts: ["upper legs"],
      equipments: ["barbell"],
      sets: 3,
      defaultWeight: 40,
      order: 0
    },
    {
      exerciseId: "7F1DVzn",
      name: "Bench Press",
      gifUrl: "https://static.exercisedb.dev/media/7F1DVzn.gif",
      targetMuscles: ["chest"],
      bodyParts: ["chest"],
      equipments: ["barbell"],
      sets: 3,
      defaultWeight: 35,
      order: 1
    },
    {
      exerciseId: "72BC5Za",
      name: "Pull-ups",
      gifUrl: "https://static.exercisedb.dev/media/72BC5Za.gif",
      targetMuscles: ["lats"],
      bodyParts: ["back"],
      equipments: ["body weight"],
      sets: 3,
      defaultWeight: 0,
      order: 2
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
});

print(`   ✓ Kreirano ${db.workouttemplates.countDocuments()} workout templates`);

// ===== WORKOUT SESSIONS =====
print("\n5. Kreiranje workout sessions...");

// Završena sesija 1 - od pre 7 dana
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
const sevenDaysAgoEnd = new Date(sevenDaysAgo);
sevenDaysAgoEnd.setMinutes(sevenDaysAgoEnd.getMinutes() + 65);

db.workoutsessions.insertOne({
  userId: user1.insertedId,
  templateId: pushTemplate.insertedId,
  templateName: "Push Day - Grudi i Ramena",
  status: "completed",
  startTime: sevenDaysAgo,
  endTime: sevenDaysAgoEnd,
  exercises: [
    {
      exerciseId: "7F1DVzn",
      name: "Bench Press",
      gifUrl: "https://static.exercisedb.dev/media/7F1DVzn.gif",
      sets: [
        { setNumber: 1, weight: 50, reps: 12, isPersonalRecord: false },
        { setNumber: 2, weight: 60, reps: 10, isPersonalRecord: false },
        { setNumber: 3, weight: 65, reps: 8, isPersonalRecord: true },
        { setNumber: 4, weight: 60, reps: 9, isPersonalRecord: false }
      ]
    },
    {
      exerciseId: "dmgMp3n",
      name: "Incline Dumbbell Press",
      gifUrl: "https://static.exercisedb.dev/media/dmgMp3n.gif",
      sets: [
        { setNumber: 1, weight: 25, reps: 12, isPersonalRecord: false },
        { setNumber: 2, weight: 30, reps: 10, isPersonalRecord: false },
        { setNumber: 3, weight: 32.5, reps: 8, isPersonalRecord: true },
        { setNumber: 4, weight: 30, reps: 9, isPersonalRecord: false }
      ]
    }
  ],
  totalVolume: 3285,
  duration: 65,
  notes: "Odličan trening, novi PR na bench press-u!"
});

// Završena sesija 2 - od pre 3 dana
const threeDaysAgo = new Date();
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
const threeDaysAgoEnd = new Date(threeDaysAgo);
threeDaysAgoEnd.setMinutes(threeDaysAgoEnd.getMinutes() + 70);

db.workoutsessions.insertOne({
  userId: user1.insertedId,
  templateId: pullTemplate.insertedId,
  templateName: "Pull Day - Leđa i Biceps",
  status: "completed",
  startTime: threeDaysAgo,
  endTime: threeDaysAgoEnd,
  exercises: [
    {
      exerciseId: "72BC5Za",
      name: "Pull-ups",
      gifUrl: "https://static.exercisedb.dev/media/72BC5Za.gif",
      sets: [
        { setNumber: 1, weight: 0, reps: 10, isPersonalRecord: false },
        { setNumber: 2, weight: 0, reps: 8, isPersonalRecord: false },
        { setNumber: 3, weight: 0, reps: 7, isPersonalRecord: false },
        { setNumber: 4, weight: 0, reps: 6, isPersonalRecord: false }
      ]
    },
    {
      exerciseId: "dmgMp3n",
      name: "Barbell Row",
      gifUrl: "https://static.exercisedb.dev/media/dmgMp3n.gif",
      sets: [
        { setNumber: 1, weight: 45, reps: 12, isPersonalRecord: false },
        { setNumber: 2, weight: 50, reps: 10, isPersonalRecord: false },
        { setNumber: 3, weight: 52.5, reps: 8, isPersonalRecord: false },
        { setNumber: 4, weight: 50, reps: 9, isPersonalRecord: false }
      ]
    }
  ],
  totalVolume: 2160,
  duration: 70,
  notes: "Pull-up forma se poboljšava"
});

// Aktivna sesija
db.workoutsessions.insertOne({
  userId: user1.insertedId,
  templateId: legTemplate.insertedId,
  templateName: "Leg Day - Noge",
  status: "active",
  startTime: new Date(),
  exercises: [
    {
      exerciseId: "ZZTGMKh",
      name: "Squat",
      gifUrl: "https://static.exercisedb.dev/media/ZZTGMKh.gif",
      sets: [
        { setNumber: 1, weight: 70, reps: 12, isPersonalRecord: false },
        { setNumber: 2, weight: 80, reps: 10, isPersonalRecord: false }
      ]
    }
  ],
  totalVolume: 0,
  duration: 0,
  notes: ""
});

// Sesija za drugog korisnika
const yesterdayAna = new Date();
yesterdayAna.setDate(yesterdayAna.getDate() - 1);
const yesterdayAnaEnd = new Date(yesterdayAna);
yesterdayAnaEnd.setMinutes(yesterdayAnaEnd.getMinutes() + 45);

db.workoutsessions.insertOne({
  userId: user2.insertedId,
  templateId: fullBodyTemplate.insertedId,
  templateName: "Full Body Workout",
  status: "completed",
  startTime: yesterdayAna,
  endTime: yesterdayAnaEnd,
  exercises: [
    {
      exerciseId: "ZZTGMKh",
      name: "Squat",
      gifUrl: "https://static.exercisedb.dev/media/ZZTGMKh.gif",
      sets: [
        { setNumber: 1, weight: 35, reps: 12, isPersonalRecord: false },
        { setNumber: 2, weight: 40, reps: 10, isPersonalRecord: false },
        { setNumber: 3, weight: 40, reps: 10, isPersonalRecord: false }
      ]
    },
    {
      exerciseId: "7F1DVzn",
      name: "Bench Press",
      gifUrl: "https://static.exercisedb.dev/media/7F1DVzn.gif",
      sets: [
        { setNumber: 1, weight: 30, reps: 12, isPersonalRecord: false },
        { setNumber: 2, weight: 35, reps: 10, isPersonalRecord: false },
        { setNumber: 3, weight: 35, reps: 9, isPersonalRecord: false }
      ]
    }
  ],
  totalVolume: 1795,
  duration: 45,
  notes: "Prvi full body trening - osećaj odličan!"
});

print(`   ✓ Kreirano ${db.workoutsessions.countDocuments()} workout sessions`);

// ===== INDEXES =====
print("\n6. Kreiranje indeksa za optimizaciju...");

// User indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });

// WorkoutTemplate indexes
db.workouttemplates.createIndex({ userId: 1, createdAt: -1 });
db.workouttemplates.createIndex({ userId: 1, name: 1 });

// WorkoutSession indexes
db.workoutsessions.createIndex({ userId: 1, status: 1 });
db.workoutsessions.createIndex({ userId: 1, startTime: -1 });
db.workoutsessions.createIndex({ userId: 1, templateId: 1 });

// Compound index za exercise statistics
db.workoutsessions.createIndex({ userId: 1, "exercises.exerciseId": 1, status: 1 });

// TTL index za cancelled sessions (brišu se automatski posle 30 dana)
db.workoutsessions.createIndex(
  { createdAt: 1 },
  { 
    expireAfterSeconds: 2592000,
    partialFilterExpression: { status: "cancelled" }
  }
);

print("   ✓ Indeksi kreirani");

// ===== VALIDATION =====
print("\n7. Dodavanje validacije šeme...");

db.runCommand({
  collMod: "users",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "email", "password"],
      properties: {
        username: {
          bsonType: "string",
          minLength: 3,
          maxLength: 30
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
        },
        password: {
          bsonType: "string"
        }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

print("   ✓ Validacija dodata");

// ===== SUMMARY =====
print("\n=== Inicijalizacija završena! ===\n");
print("Statistika:");
print(`  Users: ${db.users.countDocuments()}`);
print(`  Workout Templates: ${db.workouttemplates.countDocuments()}`);
print(`  Workout Sessions: ${db.workoutsessions.countDocuments()}`);
print("\nTest nalozi:");
print("  Email: marko@fittrack.com | Password: password123");
print("  Email: ana@fittrack.com | Password: password123");
print("\n=======================================\n");
