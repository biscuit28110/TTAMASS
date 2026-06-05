import { PrismaClient, MuscleGroup } from "@prisma/client";

const prisma = new PrismaClient();

const exercises = [
  // CHEST
  { name: "Bench Press", muscleGroup: MuscleGroup.CHEST },
  { name: "Incline Bench Press", muscleGroup: MuscleGroup.CHEST },
  { name: "Decline Bench Press", muscleGroup: MuscleGroup.CHEST },
  { name: "Dumbbell Fly", muscleGroup: MuscleGroup.CHEST },
  { name: "Cable Crossover", muscleGroup: MuscleGroup.CHEST },
  { name: "Push-Up", muscleGroup: MuscleGroup.CHEST },
  { name: "Dips", muscleGroup: MuscleGroup.CHEST },

  // BACK
  { name: "Deadlift", muscleGroup: MuscleGroup.BACK },
  { name: "Pull-Up", muscleGroup: MuscleGroup.BACK },
  { name: "Chin-Up", muscleGroup: MuscleGroup.BACK },
  { name: "Barbell Row", muscleGroup: MuscleGroup.BACK },
  { name: "Dumbbell Row", muscleGroup: MuscleGroup.BACK },
  { name: "Seated Cable Row", muscleGroup: MuscleGroup.BACK },
  { name: "Lat Pulldown", muscleGroup: MuscleGroup.BACK },
  { name: "T-Bar Row", muscleGroup: MuscleGroup.BACK },
  { name: "Face Pull", muscleGroup: MuscleGroup.BACK },

  // SHOULDERS
  { name: "Overhead Press", muscleGroup: MuscleGroup.SHOULDERS },
  { name: "Dumbbell Shoulder Press", muscleGroup: MuscleGroup.SHOULDERS },
  { name: "Lateral Raise", muscleGroup: MuscleGroup.SHOULDERS },
  { name: "Front Raise", muscleGroup: MuscleGroup.SHOULDERS },
  { name: "Arnold Press", muscleGroup: MuscleGroup.SHOULDERS },
  { name: "Upright Row", muscleGroup: MuscleGroup.SHOULDERS },
  { name: "Shrug", muscleGroup: MuscleGroup.SHOULDERS },

  // BICEPS
  { name: "Barbell Curl", muscleGroup: MuscleGroup.BICEPS },
  { name: "Dumbbell Curl", muscleGroup: MuscleGroup.BICEPS },
  { name: "Hammer Curl", muscleGroup: MuscleGroup.BICEPS },
  { name: "Incline Dumbbell Curl", muscleGroup: MuscleGroup.BICEPS },
  { name: "Preacher Curl", muscleGroup: MuscleGroup.BICEPS },
  { name: "Cable Curl", muscleGroup: MuscleGroup.BICEPS },
  { name: "Concentration Curl", muscleGroup: MuscleGroup.BICEPS },

  // TRICEPS
  { name: "Tricep Pushdown", muscleGroup: MuscleGroup.TRICEPS },
  { name: "Skull Crusher", muscleGroup: MuscleGroup.TRICEPS },
  { name: "Overhead Tricep Extension", muscleGroup: MuscleGroup.TRICEPS },
  { name: "Close-Grip Bench Press", muscleGroup: MuscleGroup.TRICEPS },
  { name: "Tricep Kickback", muscleGroup: MuscleGroup.TRICEPS },
  { name: "Diamond Push-Up", muscleGroup: MuscleGroup.TRICEPS },

  // FOREARMS
  { name: "Wrist Curl", muscleGroup: MuscleGroup.FOREARMS },
  { name: "Reverse Wrist Curl", muscleGroup: MuscleGroup.FOREARMS },
  { name: "Farmer's Walk", muscleGroup: MuscleGroup.FOREARMS },

  // ABS
  { name: "Crunch", muscleGroup: MuscleGroup.ABS },
  { name: "Plank", muscleGroup: MuscleGroup.ABS },
  { name: "Leg Raise", muscleGroup: MuscleGroup.ABS },
  { name: "Russian Twist", muscleGroup: MuscleGroup.ABS },
  { name: "Cable Crunch", muscleGroup: MuscleGroup.ABS },
  { name: "Ab Wheel Rollout", muscleGroup: MuscleGroup.ABS },
  { name: "Hanging Leg Raise", muscleGroup: MuscleGroup.ABS },

  // GLUTES
  { name: "Hip Thrust", muscleGroup: MuscleGroup.GLUTES },
  { name: "Glute Bridge", muscleGroup: MuscleGroup.GLUTES },
  { name: "Cable Kickback", muscleGroup: MuscleGroup.GLUTES },

  // QUADS
  { name: "Squat", muscleGroup: MuscleGroup.QUADS },
  { name: "Front Squat", muscleGroup: MuscleGroup.QUADS },
  { name: "Leg Press", muscleGroup: MuscleGroup.QUADS },
  { name: "Leg Extension", muscleGroup: MuscleGroup.QUADS },
  { name: "Hack Squat", muscleGroup: MuscleGroup.QUADS },
  { name: "Bulgarian Split Squat", muscleGroup: MuscleGroup.QUADS },
  { name: "Lunge", muscleGroup: MuscleGroup.QUADS },

  // HAMSTRINGS
  { name: "Romanian Deadlift", muscleGroup: MuscleGroup.HAMSTRINGS },
  { name: "Leg Curl", muscleGroup: MuscleGroup.HAMSTRINGS },
  { name: "Good Morning", muscleGroup: MuscleGroup.HAMSTRINGS },
  { name: "Nordic Curl", muscleGroup: MuscleGroup.HAMSTRINGS },
  { name: "Sumo Deadlift", muscleGroup: MuscleGroup.HAMSTRINGS },

  // CALVES
  { name: "Standing Calf Raise", muscleGroup: MuscleGroup.CALVES },
  { name: "Seated Calf Raise", muscleGroup: MuscleGroup.CALVES },
  { name: "Leg Press Calf Raise", muscleGroup: MuscleGroup.CALVES },

  // FULL BODY
  { name: "Clean and Press", muscleGroup: MuscleGroup.FULL_BODY },
  { name: "Thruster", muscleGroup: MuscleGroup.FULL_BODY },
  { name: "Burpee", muscleGroup: MuscleGroup.FULL_BODY },
  { name: "Kettlebell Swing", muscleGroup: MuscleGroup.FULL_BODY },
  { name: "Power Clean", muscleGroup: MuscleGroup.FULL_BODY },

  // CARDIO
  { name: "Treadmill", muscleGroup: MuscleGroup.CARDIO },
  { name: "Rowing Machine", muscleGroup: MuscleGroup.CARDIO },
  { name: "Stationary Bike", muscleGroup: MuscleGroup.CARDIO },
  { name: "Jump Rope", muscleGroup: MuscleGroup.CARDIO },
  { name: "Elliptical", muscleGroup: MuscleGroup.CARDIO },
];

async function main() {
  console.log("Seeding exercises...");

  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { name: exercise.name },
      update: {},
      create: { ...exercise, isCustom: false },
    });
  }

  console.log(`✓ ${exercises.length} exercises seeded.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
