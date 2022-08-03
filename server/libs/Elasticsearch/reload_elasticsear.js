import ElasticSearch from '../Elasticsearch';
import Payload from './payload';

const indexs = [
  {
    index:'users',
    payload: Payload.payload_users
  },
  {
    index:'courses',
    payload: Payload.payload_courses
  },
  {
    index:'knowledge',
    payload: Payload.payload_knowledge
  },
  {
    index:'tesse_questions',
    payload: Payload.payload_questions
  },
  {
    index:'skills',
    payload: Payload.payload_skills
  },
  {
    index:'webinars',
    payload: Payload.payload_webinars
  }
];
export async function createIndex() {
  try{
    let create_promise = indexs.map(async e =>{
      await ElasticSearch.deloyDocument(e.index, e.payload);
    });
    await Promise.all(create_promise);
    console.log('==================== Create Done. =======================');
    return true;
  }catch (err) {
    throw err;
  }
}
export async function clearIndex() {
  try {
    let delete_promise = indexs.map(async e =>{
      await ElasticSearch.deleteDocuments(e.index);
    });
    await Promise.all(delete_promise);
    console.log('==================== Delete Done. =======================');
    return true;
  }catch (err) {
    throw err;
  }
}
