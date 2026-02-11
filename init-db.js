// FitTrack init script (mongosh)
// Učitavanje:
// mongosh "mongodb+srv://cluster0.0p7cyw3.mongodb.net/fittrack" --apiVersion 1 --username fittrack --file init-db.js

print("=== FitTrack Database Initialization ===\n");

// izaberi bazu kao JS objekat
const dbName = "fittrack";
const db = db.getSiblingDB(dbName);


// DROP (bez pucanja ako ne postoji)
for (const col of ["users", "workouttemplates", "workoutsessions"]) {
  try { db.getCollection(col).drop(); } catch (e) {}
}

// ===== USERS =====
// Password je bcrypt hash za: password123
const PASS_HASH = "$2b$10$9kUBWjYts2AOtQntU9Lk8OR0jR3DrSrCp..WAlrWz7A.7gVRobLyu";

print("1) Kreiram test korisnike...");
const user1 = db.users.insertOne({
  username: "marko",
  email: "marko@fittrack.com",
  password: PASS_HASH,
  createdAt: new Date(),
  updatedAt: new Date()
});

const user2 = db.users.insertOne({
  username: "ana",
  email: "ana@fittrack.com",
  password: PASS_HASH,
  createdAt: new Date(),
  updatedAt: new Date()
});

print(`   ✓ users: ${db.users.countDocuments()}`);

// ===== WORKOUT TEMPLATES =====
print("2) Kreiram workout template-e...");

const pushTemplate = db.workouttemplates.insertOne({
  userId: user1.insertedId,
  name: "Push Day - Grudi i Ramena",
  description: "Fokus na grudi, delte, triceps",
  exercises: [
    { exerciseId: "7F1DVzn", name: "Bench Press", gifUrl: "https://static.exercisedb.dev/media/7F1DVzn.gif", sets: 4, defaultWeight: 60, order: 0 },
    { exerciseId: "dmgMp3n", name: "Incline Dumbbell Press", gifUrl: "https://static.exercisedb.dev/media/dmgMp3n.gif", sets: 4, defaultWeight: 30, order: 1 },
    { exerciseId: "JGKowMS", name: "Shoulder Press", gifUrl: "https://static.exercisedb.dev/media/JGKowMS.gif", sets: 3, defaultWeight: 40, order: 2 },
    { exerciseId: "8d8qJQI", name: "Lateral Raises", gifUrl: "https://static.exercisedb.dev/media/8d8qJQI.gif", sets: 3, defaultWeight: 12, order: 3 }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
});

const pullTemplate = db.workouttemplates.insertOne({
  userId: user1.insertedId,
  name: "Pull Day - Leđa i Biceps",
  description: "Fokus na leđa + biceps",
  exercises: [
    { exerciseId: "72BC5Za", name: "Pull-ups", gifUrl: "https://static.exercisedb.dev/media/72BC5Za.gif", sets: 4, defaultWeight: 0, order: 0 },
    { exerciseId: "dmgMp3n", name: "Barbell Row", gifUrl: "https://static.exercisedb.dev/media/dmgMp3n.gif", sets: 4, defaultWeight: 50, order: 1 },
    { exerciseId: "7F1DVzn", name: "Lat Pulldown", gifUrl: "https://static.exercisedb.dev/media/7F1DVzn.gif", sets: 3, defaultWeight: 45, order: 2 },
    { exerciseId: "VPPtusI", name: "Bicep Curls", gifUrl: "https://static.exercisedb.dev/media/VPPtusI.gif", sets: 3, defaultWeight: 15, order: 3 }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
});

const legTemplate = db.workouttemplates.insertOne({
  userId: user1.insertedId,
  name: "Leg Day - Noge",
  description: "Trening nogu",
  exercises: [
    { exerciseId: "ZZTGMKh", name: "Squat", gifUrl: "https://static.exercisedb.dev/media/ZZTGMKh.gif", sets: 5, defaultWeight: 80, order: 0 },
    { exerciseId: "72BC5Za", name: "Romanian Deadlift", gifUrl: "https://static.exercisedb.dev/media/72BC5Za.gif", sets: 4, defaultWeight: 60, order: 1 },
    { exerciseId: "VPPtusI", name: "Leg Press", gifUrl: "https://static.exercisedb.dev/media/VPPtusI.gif", sets: 4, defaultWeight: 120, order: 2 }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
});

const fullBodyTemplate = db.workouttemplates.insertOne({
  userId: user2.insertedId,
  name: "Full Body Workout",
  description: "Trening celog tela",
  exercises: [
    { exerciseId: "ZZTGMKh", name: "Squat", gifUrl: "https://static.exercisedb.dev/media/ZZTGMKh.gif", sets: 3, defaultWeight: 40, order: 0 },
    { exerciseId: "7F1DVzn", name: "Bench Press", gifUrl: "https://static.exercisedb.dev/media/7F1DVzn.gif", sets: 3, defaultWeight: 35, order: 1 },
    { exerciseId: "72BC5Za", name: "Pull-ups", gifUrl: "https://static.exercisedb.dev/media/72BC5Za.gif", sets: 3, defaultWeight: 0, order: 2 }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
});

print(`   ✓ workouttemplates: ${db.workouttemplates.countDocuments()}`);

// ===== WORKOUT SESSIONS =====
print("3) Kreiram workout session-e...");

const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
const sevenDaysAgoEnd = new Date(sevenDaysAgo); sevenDaysAgoEnd.setMinutes(sevenDaysAgoEnd.getMinutes() + 65);

db.workoutsessions.insertOne({
  userId: user1.insertedId,
  templateId: pushTemplate.insertedId,
  templateName: "Push Day - Grudi i Ramena",
  status: "completed",
  startTime: sevenDaysAgo,
  endTime: sevenDaysAgoEnd,
  exercises: [
    { exerciseId: "7F1DVzn", name: "Bench Press", gifUrl: "https://static.exercisedb.dev/media/7F1DVzn.gif",
      sets: [{ setNumber: 1, weight: 50, reps: 12 }, { setNumber: 2, weight: 60, reps: 10 }, { setNumber: 3, weight: 65, reps: 8 }, { setNumber: 4, weight: 60, reps: 9 }] }
  ],
  totalVolume: 3285,
  duration: 65,
  notes: "Test session",
  createdAt: new Date(),
  updatedAt: new Date()
});

db.workoutsessions.insertOne({
  userId: user1.insertedId,
  templateId: legTemplate.insertedId,
  templateName: "Leg Day - Noge",
  status: "active",
  startTime: new Date(),
  exercises: [
    { exerciseId: "ZZTGMKh", name: "Squat", gifUrl: "https://static.exercisedb.dev/media/ZZTGMKh.gif",
      sets: [{ setNumber: 1, weight: 70, reps: 12 }, { setNumber: 2, weight: 80, reps: 10 }] }
  ],
  totalVolume: 0,
  duration: 0,
  notes: "",
  createdAt: new Date(),
  updatedAt: new Date()
});

const yesterdayAna = new Date(); yesterdayAna.setDate(yesterdayAna.getDate() - 1);
const yesterdayAnaEnd = new Date(yesterdayAna); yesterdayAnaEnd.setMinutes(yesterdayAnaEnd.getMinutes() + 45);

db.workoutsessions.insertOne({
  userId: user2.insertedId,
  templateId: fullBodyTemplate.insertedId,
  templateName: "Full Body Workout",
  status: "completed",
  startTime: yesterdayAna,
  endTime: yesterdayAnaEnd,
  exercises: [
    { exerciseId: "ZZTGMKh", name: "Squat", gifUrl: "https://static.exercisedb.dev/media/ZZTGMKh.gif",
      sets: [{ setNumber: 1, weight: 35, reps: 12 }, { setNumber: 2, weight: 40, reps: 10 }, { setNumber: 3, weight: 40, reps: 10 }] }
  ],
  totalVolume: 1795,
  duration: 45,
  notes: "Ana test",
  createdAt: new Date(),
  updatedAt: new Date()
});

print(`   ✓ workoutsessions: ${db.workoutsessions.countDocuments()}`);

// ===== INDEXES (korisno) =====
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });

db.workouttemplates.createIndex({ userId: 1, createdAt: -1 });
db.workoutsessions.createIndex({ userId: 1, startTime: -1 });

print("\n=== Done ===");
print("Test nalozi:");
print("  marko@fittrack.com / password123");
print("  ana@fittrack.com / password123");
