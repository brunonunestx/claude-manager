-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "userMessage" TEXT NOT NULL DEFAULT '',
    "sdkSessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "transcript" TEXT NOT NULL DEFAULT '[]',
    "resultText" TEXT,
    "errorText" TEXT,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Session" ("createdAt", "endedAt", "errorText", "id", "resultText", "startedAt", "status", "taskId", "transcript") SELECT "createdAt", "endedAt", "errorText", "id", "resultText", "startedAt", "status", "taskId", "transcript" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
