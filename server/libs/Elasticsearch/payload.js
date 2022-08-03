export default {
  payload_users : {
    mappings:{
      users:{
        properties:{
          id:{
            type: 'string'
          },
          search_text:{
            type: 'string',
          }
        }
      }
    }
  },
  payload_courses:{
    mappings:{
      courses:{
        properties:{
          id:{
            type: 'string'
          },
          status:{
            type: 'integer'
          },
          search_text:{
            type: 'string'
          }
        }
      }
    }
  },
  payload_knowledge:{
    mappings:{
      knowledge:{
        properties:{
          id:{
            type: 'string'
          },
          search_text:{
            type: 'string'
          },
          departmentId:{
            type: 'string'
          },
          createdDate: {
            type: 'string'
          },
          language: {
            type: 'string'
          },
          title: {
            type: 'string'
          }
        }
      }
    }
  },
  payload_questions:{
    mappings:{
      tesse_questions:{
        properties:{
          id:{
            type: 'string'
          },
          search_text:{
            type: 'string'
          },
          department:{
            type: 'string'
          },
          createdDate:{
            type: 'string'
          },
          title: {
            type: 'string'
          }
        }
      }
    }
  },
  payload_skills:{
    mappings:{
      skills:{
        properties:{
          id: {
            type: 'string'
          },
          name: {
            type: 'string'
          }
        }
      }
    }
  },
  payload_webinars:{
    mappings:{
      webinars:{
        properties:{
          id:{
            type: 'string'
          },
          search_text:{
            type: 'string'
          },
          status:{
            type: 'string'
          },
          dateLiveStream:{
            type: 'string'
          }
        }
      }
    }
  }
}
