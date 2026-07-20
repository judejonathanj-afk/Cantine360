-- Index pour les filtres multi-établissements (scale ~400 cantines).
CREATE INDEX IF NOT EXISTS "Group_establishmentId_idx" ON "Group"("establishmentId");
CREATE INDEX IF NOT EXISTS "Student_establishmentId_idx" ON "Student"("establishmentId");
CREATE INDEX IF NOT EXISTS "AttendanceImport_establishmentId_idx" ON "AttendanceImport"("establishmentId");
CREATE INDEX IF NOT EXISTS "ServiceGroupMetrics_groupId_idx" ON "ServiceGroupMetrics"("groupId");
CREATE INDEX IF NOT EXISTS "MenuItem_menuId_idx" ON "MenuItem"("menuId");
