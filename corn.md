# Feature Request: Auto-Cleaning Rolling Product System (FIFO)

I want a self-cleaning "rolling window" system for my products (or any collection).
It should run silently in the background — no notifications, no visible logs,
no user/admin should be aware it is happening.

## Exact behavior I want

1. INSERT-TRIGGERED DELETE
   - Only when a NEW product is CREATED (not on edit/update).
   - When N new products are inserted, delete the N OLDEST existing products.
   - Example: insert 1 → delete 1 oldest. Insert 3 → delete 3 oldest.

2. DAILY TIME-BASED DELETE
   - Once every day, automatically delete the single OLDEST product,
     even if nobody inserted anything and nobody visited the site.
   - This must run on the server on a schedule (cron / scheduler),
     independent of any user action.

3. "OLDEST" DEFINITION
   - Determined by the creation timestamp (createdAt), FIFO order —
     the earliest-created product is always the first to be deleted.

## Decisions already made (do NOT add these safeguards)

- It is FINE if the product count drops all the way to 0.
  Do NOT add a minimum-count floor or "stop deleting when low" logic.
- I do NOT care about associated files/images or disk cleanup.
  Just delete the database records. 
- Deletion must be permanent and silent (hard delete, no soft-delete flag,
  unless you recommend otherwise and explain why).