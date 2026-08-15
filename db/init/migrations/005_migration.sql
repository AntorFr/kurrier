ALTER TABLE "threads" ADD COLUMN IF NOT EXISTS "normalized_subject" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_threads_owner_norm_subject" ON "threads" USING btree ("owner_id","normalized_subject","last_message_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_messages_references_gin" ON "messages" USING gin ("references");--> statement-breakpoint
UPDATE "threads" t
SET "normalized_subject" = NULLIF(
  lower(trim(regexp_replace(
    (SELECT mm.subject FROM "messages" mm
      WHERE mm.thread_id = t.id
      ORDER BY coalesce(mm.date, mm.created_at) ASC
      LIMIT 1),
    '^\s*(((re|fwd?|fw|aw|tr|sv|vs|rv|res)(\[[0-9]+\])?)\s*:\s*)+', '', 'i'
  ))), ''
)
WHERE t."normalized_subject" IS NULL;
