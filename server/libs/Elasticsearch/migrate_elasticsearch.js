import {clearIndex, createIndex} from "./reload_elasticsear";
import MigrateCourse from '../../scripts/migrate/migrate_course_to_elasticsearch';
import MigrateUser from '../../scripts/migrate/migrate_users_to_elasticsearch';
import MigrateKnowledge from '../../scripts/migrate/migrate_knowledge_to_elasticsearch';
import MigrateQuestions from '../../scripts/migrate/migrate_questions_to_elasticsearch';
import MigrateWebinars from '../../scripts/migrate/migrate_webinar_to_elasticsearch';
import MigrateSkills from '../../scripts/migrate/migrate_skills_to_elasticsearch_2';
import logger from '../../util/log';

export async function migrateElasticSearchAll() {
  try {
    await clearIndex();
    await createIndex();
    await MigrateCourse();
    await MigrateUser();
    await MigrateKnowledge();
    await MigrateQuestions();
    await MigrateWebinars();
    await MigrateSkills();
    return true;
  } catch (err) {
    logger.error(`error migrateElasticSearchAll: ${err.toString()}`);
  }
}
