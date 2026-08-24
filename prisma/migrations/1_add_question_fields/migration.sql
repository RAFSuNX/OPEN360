-- Add applicable_role and self_text to questions, question_template_items, cycle_questions
ALTER TABLE "questions" ADD COLUMN "applicable_role" text;
ALTER TABLE "questions" ADD COLUMN "self_text" text;

ALTER TABLE "question_template_items" ADD COLUMN "applicable_role" text;
ALTER TABLE "question_template_items" ADD COLUMN "self_text" text;

ALTER TABLE "cycle_questions" ADD COLUMN "applicable_role" text;
ALTER TABLE "cycle_questions" ADD COLUMN "self_text" text;
