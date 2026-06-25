ALTER TABLE "client" ADD COLUMN "document" text;--> statement-breakpoint
CREATE INDEX "client_userId_document_idx" ON "client" USING btree ("user_id","document");