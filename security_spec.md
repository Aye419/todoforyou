# Security Specification: Task Management Board

This security specification establishes the Attribute-Based Access Control (ABAC) invariants, malicious payload test targets, and security expectations for the Task Management Board Firestore instance.

## 1. Data Invariants

1. **Authentication Boundary**: All CRUD operations require authentication. Anonymous and signed-in users are permitted (our app uses secure anonymous authentication as a default backdrop identity).
2. **Identification Integrity**: A user can only perform updates if they are authenticated.
3. **Task Constraints**:
   - A task must have a title (1 to 200 characters).
   - A task must specify valid `categoryId` and `assigneeId`.
   - The task `status` must strictly be one of `['todo', 'in_progress', 'completed']`.
   - The task `priority` must strictly be one of `['low', 'medium', 'high']`.
4. **Immutable Fields**:
   - The `id` and `createdAt` of any document (Tasks, Categories, Assignees) are immutable after creation.
5. **State Transition Integrity**:
   - Completed tasks are in a terminal state; subsequent updates to completed tasks are restricted unless specifically re-opened to 'todo' status.

---

## 2. The "Dirty Dozen" Payloads (Anti-Patterns to Reject)

These payloads represents unauthorized attempts to poison data, bypass type constraints, or spoof identities. Security rules MUST reject them.

### Category Collection Attack Payloads
1. **Unauthenticated Write**: Creating a category without a session.
2. **Gigantic Hex Color**: Injecting a 1MB string into the `color` field.
3. **Missing Critical Keys**: Creating a category without the `color` attribute.

### Assignee Collection Attack Payloads
4. **Id Poisoning**: Injecting an ID with control characters (`user/../../malicious`).
5. **Missing Required Fields**: Creating an assignee with no `name`.
6. **Self-Assigned Identity**: Authenticated user trying to overwrite another assignee's ID fields.

### Task Collection Attack Payloads
7. **Malformed Status**: Creating a task with status `done` (instead of `completed`).
8. **Malformed Priority**: Creating a task with priority `critical` (instead of `low`/`medium`/`high`).
9. **Gigantic Title**: Bypassing title length checks with a 10KB string to blow up rendering and storage.
10. **Time-Travel Tampering**: Modifying the `createdAt` timestamp during an update.
11. **Orphaned Association**: Creating a task with blank or missing `categoryId`.
12. **Status Shortcutting**: Setting a task to `completed` but bypassing standard timestamps.

---

## 3. Test Runner Outline (`firestore.rules.test.ts`)

A mock typescript test suite representing how these rules can be programmatically tested using the Firebase Rules Unit Testing Library (`@firebase/rules-unit-testing`).

```typescript
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "todo-list-app-june2026",
    firestore: {
      rules: require('fs').readFileSync('firestore.rules', 'utf8')
    }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

test("Reject Dirty Dozen #1: Unauthenticated Create Category", async () => {
  const unauthedDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(
    setDoc(doc(unauthedDb, "categories/cat-malicious"), {
      id: "cat-malicious",
      name: "Malicious Category",
      color: "#ff0000"
    })
  );
});

test("Reject Dirty Dozen #7: Malformed Task Status", async () => {
  const authedDb = testEnv.authenticatedContext("user-123").firestore();
  await assertFails(
    setDoc(doc(authedDb, "tasks/task-malicious"), {
      id: "task-malicious",
      title: "Hacked Task",
      categoryId: "cat-1",
      assigneeId: "user-1",
      status: "done", // Malformed, should be "completed"
      priority: "medium",
      plannedStart: "2026-06-27T10:00",
      plannedEnd: "2026-06-28T10:00",
      createdAt: "2026-06-27T10:00:00Z"
    })
  );
});
```
