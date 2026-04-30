-- CreateTable question_templates
CREATE TABLE "question_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "question_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable question_template_items
CREATE TABLE "question_template_items" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "rating_scale" INTEGER,
    "category" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    CONSTRAINT "question_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable cycle_questions
CREATE TABLE "cycle_questions" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "source_template_item_id" TEXT,
    "text" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "rating_scale" INTEGER,
    "category" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    CONSTRAINT "cycle_questions_pkey" PRIMARY KEY ("id")
);

-- AlterTable review_cycles: add template_id
ALTER TABLE "review_cycles" ADD COLUMN "template_id" TEXT;

-- AlterTable review_responses: add cycle_question_id, make question_id nullable
ALTER TABLE "review_responses" ADD COLUMN "cycle_question_id" TEXT;
ALTER TABLE "review_responses" ALTER COLUMN "question_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "cycle_questions_cycle_id_idx" ON "cycle_questions"("cycle_id");

-- AddForeignKey
ALTER TABLE "question_template_items" ADD CONSTRAINT "question_template_items_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "question_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_questions" ADD CONSTRAINT "cycle_questions_cycle_id_fkey"
    FOREIGN KEY ("cycle_id") REFERENCES "review_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_questions" ADD CONSTRAINT "cycle_questions_source_template_item_id_fkey"
    FOREIGN KEY ("source_template_item_id") REFERENCES "question_template_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_cycles" ADD CONSTRAINT "review_cycles_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "question_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_cycle_question_id_fkey"
    FOREIGN KEY ("cycle_question_id") REFERENCES "cycle_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed default template with 24 standard questions
DO $$
DECLARE
  tmpl_id TEXT := gen_random_uuid()::TEXT;
BEGIN
  INSERT INTO "question_templates" ("id", "name", "is_default", "created_at")
  VALUES (tmpl_id, 'Default', true, NOW());

  INSERT INTO "question_template_items" ("id", "template_id", "text", "type", "rating_scale", "category", "sort_order") VALUES
    (gen_random_uuid(), tmpl_id, 'How effectively does this person communicate expectations and complex information clearly?', 'RATING', 5, 'Communication', 1),
    (gen_random_uuid(), tmpl_id, 'How well does this person balance speaking and listening in conversations and meetings?', 'RATING', 5, 'Communication', 2),
    (gen_random_uuid(), tmpl_id, 'Share a specific example of when this person communicated a difficult message or navigated a challenging conversation. What was the outcome?', 'OPEN_TEXT', NULL, 'Communication', 3),
    (gen_random_uuid(), tmpl_id, 'How effectively does this person collaborate with colleagues across different teams and functions?', 'RATING', 5, 'Collaboration', 4),
    (gen_random_uuid(), tmpl_id, 'To what extent does this person support peers on their work, even when there is no direct benefit to their own goals?', 'RATING', 5, 'Collaboration', 5),
    (gen_random_uuid(), tmpl_id, 'Describe a situation where this person demonstrated strong teamwork or faced collaboration challenges. What was the outcome?', 'OPEN_TEXT', NULL, 'Collaboration', 6),
    (gen_random_uuid(), tmpl_id, 'How effectively does this person inspire and motivate others to achieve goals?', 'RATING', 5, 'Leadership', 7),
    (gen_random_uuid(), tmpl_id, 'How well does this person develop the skills and capabilities of team members or colleagues?', 'RATING', 5, 'Leadership', 8),
    (gen_random_uuid(), tmpl_id, 'Provide an example of when this person demonstrated strong leadership or navigated a difficult leadership challenge. What was the impact?', 'OPEN_TEXT', NULL, 'Leadership', 9),
    (gen_random_uuid(), tmpl_id, 'How effectively does this person approach challenges and develop creative or practical solutions?', 'RATING', 5, 'Problem Solving', 10),
    (gen_random_uuid(), tmpl_id, 'Describe a time when this person approached a problem creatively or with good judgment. What was the approach and impact?', 'OPEN_TEXT', NULL, 'Problem Solving', 11),
    (gen_random_uuid(), tmpl_id, 'How dependable is this person in meeting deadlines and following through on commitments?', 'RATING', 5, 'Accountability', 12),
    (gen_random_uuid(), tmpl_id, 'How well does this person take ownership of their work and acknowledge both successes and failures?', 'RATING', 5, 'Accountability', 13),
    (gen_random_uuid(), tmpl_id, 'Describe a situation where this person took responsibility for results - positive or negative - and what action they took.', 'OPEN_TEXT', NULL, 'Accountability', 14),
    (gen_random_uuid(), tmpl_id, 'How effectively does this person prioritize tasks and consistently deliver high-quality work?', 'RATING', 5, 'Execution', 15),
    (gen_random_uuid(), tmpl_id, 'How well does this person align their day-to-day work with broader team and organizational goals?', 'RATING', 5, 'Execution', 16),
    (gen_random_uuid(), tmpl_id, 'Share an example of when this person delivered exceptional results on a project or task. What contributed to their success?', 'OPEN_TEXT', NULL, 'Execution', 17),
    (gen_random_uuid(), tmpl_id, 'How consistently does this person seek feedback and apply it to improve their performance?', 'RATING', 5, 'Growth', 18),
    (gen_random_uuid(), tmpl_id, 'To what extent does this person take initiative to develop new skills or deepen their expertise?', 'RATING', 5, 'Growth', 19),
    (gen_random_uuid(), tmpl_id, 'Describe a specific instance where this person took action to learn or grow. What did they do and what changed as a result?', 'OPEN_TEXT', NULL, 'Growth', 20),
    (gen_random_uuid(), tmpl_id, 'How effectively does this person manage their own emotions in stressful or high-pressure situations?', 'RATING', 5, 'Emotional Intelligence', 21),
    (gen_random_uuid(), tmpl_id, 'How well does this person empathize with others and maintain positive working relationships, even during disagreements?', 'RATING', 5, 'Emotional Intelligence', 22),
    (gen_random_uuid(), tmpl_id, 'Describe a situation where this person showed strong emotional intelligence - such as managing conflict, showing empathy, or adapting to others. What was the outcome?', 'OPEN_TEXT', NULL, 'Emotional Intelligence', 23),
    (gen_random_uuid(), tmpl_id, 'What is one thing this person should start doing, one thing they should stop doing, and one thing they should keep doing?', 'OPEN_TEXT', NULL, 'Overall', 24);
END $$;
