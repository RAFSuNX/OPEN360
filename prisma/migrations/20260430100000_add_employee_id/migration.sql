ALTER TABLE "employees" ADD COLUMN "employee_id" TEXT;
CREATE UNIQUE INDEX "employees_employee_id_key" ON "employees"("employee_id");
