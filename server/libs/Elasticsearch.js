const elasticsearch = require('elasticsearch');
import configs from '../config';

const bodybuilder = require('bodybuilder');

const esClient = new elasticsearch.Client({
  host: configs.esConfigs.host + ':' + configs.esConfigs.port
});

module.exports = {
  deloyDocument: async (index, payload) =>{
    esClient.indices.exists({index}, (err, res, status) => {
      if (res) {
        console.log(`${index} in elasticsearch exist. => Next`);
      } else {
        esClient.indices.create( {index, body:payload}, (err, res, status) => {
          if(err){
            console.log(err);
            console.log('Error create index elasticsearch.')
          } else {
            console.log(res);
          }
        })
      }
    })
  },
  deleteDocuments: async (index) => {
    esClient.indices.exists({index}, (err, res, status) => {
      if (!res) {
        console.log(`${index} in elasticsearch not's exist. => Next`);
      } else {
        esClient.indices.delete({
          index:index
        },(err,res, status)=>{
          console.log('deleted ',res);
        });
      }
    });
  },

  index: (indexName, data, typeName) => {
    if (!data.id) {
      throw new Error('Please provide id to index to Elasticsearch');
    }
    return esClient.index({
      index: indexName,
      id: data.id,
      type: typeName || indexName,
      body: data
    });
  },

  multiIndex: (indexName, data, typeName) => {
    let bulk_body = [];
    data.forEach(item => {
      bulk_body.push({index: {_index: indexName, _type: typeName || indexName, _id: item.id}});
      bulk_body.push(item);
    });
    return esClient.bulk({
      index: indexName,
      type: typeName || indexName,
      body: bulk_body
    });
  },

  update: (indexName, data, typeName, upsert) => {
    return esClient.update({
      index: indexName,
      type: typeName || indexName,
      id: data.id,
      body: {
        // put the partial document under the `doc` key
        doc: data,
        doc_as_upsert: upsert
      }
    });
  },

  delete: (indexName, id, typeName) => {
    return esClient.delete({
      index: indexName,
      type: typeName || indexName,
      id: id
    });
  },

  search:async (indexName, body, typeName) => {
    try{
      return await esClient.search({
        index: indexName,
        type: typeName || undefined,
        body: body
      });
    }catch (err){
      return '';
    }
  },

  buildESQuery: (req, limit) => {
    let queryString = req.query.q ? req.query.q.toLowerCase() : "";
    if (queryString) {
      return bodybuilder().orQuery('match', 'search_text', queryString)
        .orQuery('prefix', 'search_text', queryString)
        .size(limit)
        .build();
    }
    return null;
  }
};
