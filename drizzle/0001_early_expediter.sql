CREATE INDEX "idx_audit_logs_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_admin_id" ON "audit_logs" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_admin_id" ON "sessions" USING btree ("admin_id");