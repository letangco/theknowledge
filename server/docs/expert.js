/**
 * @api {get} /api/experts/search Search experts
 * @apiName SearchExperts
 * @apiVersion 1.0.0
 * @apiGroup Expert
 *
 * @apiParam {String} q User's input string.
 * @apiParam {String} la  Language Support filter.
 * @apiParam {String} co  Country filter.
 * @apiParam {String} sort  Sort type: `1` - base on skill rates, `2` - base on service rating, `3` - base on number connection (next version), `4` - base on price call, `5` - base on price chat. Default will be 1.
 * @apiParam {String} order  Sort Order Type: `desc` or `asc`.
 * @apiParam {String} page  Page to search. Default will be 1.
 *
 * @apiParamExample {json} Request-Example:
 *     curl "dev-tesse-demo.finalthemes.com:8000/api/experts/search?q=javascript&la=en&co=vn&sort=4&order=asc&page=2"
 *
 * @apiSuccess {Number} numFound Total experts found.
 * @apiSuccess {Array} data  _id of the Knowledge.
 * @apiSuccess {Number} totalPages  Total pages.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *		  "numFound": 7,
 *		  "data": [
 *		    {
 *		      "id": "58cb83c6af26811724e555dd",
 *		      "avatar": "/uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1489739736040.png",
 *		      "fullName": "John Smith",
 *		      "country": {
 *		        "cuid": "cizxjgdvk01u1i3gdvskfnonf",
 *		        "name": "United States",
 *		        "ISO2": "US",
 *		        "ISO3": "USA"
 *		      },
 *		      "rate": 0,
 *		      "totalRate": 0,
 *		      "priceCall": 0,
 *		      "priceChat": 0,
 *		      "skills": [
 *		        {
 *		          "skillName": "HTML",
 *		          "rate": 0
 *		        },
 *		        {
 *		          "skillName": "CSS",
 *		          "rate": 0
 *		        },
 *		        {
 *		          "skillName": "PHP",
 *		          "rate": 0
 *		        },
 *		        {
 *		          "skillName": "ReactJS",
 *		          "rate": 0
 *		        },
 *		        {
 *		          "skillName": "NodeJS",
 *		          "rate": 0
 *		        },
 *		        {
 *		          "skillName": "MySQL",
 *		          "rate": 0
 *		        },
 *		        {
 *		          "skillName": "mongoDB",
 *		          "rate": 0
 *		        },
 *		        {
 *		          "skillName": "JavaScript",
 *		          "rate": 0
 *		        },
 *		        {
 *		          "skillName": "Shopping Carts",
 *		          "rate": 0
 *		        },
 *		        {
 *		          "skillName": "Search Engine Marketing (SEO)",
 *		          "rate": 0
 *		        },
 *		        {
 *		          "skillName": "Marketing management",
 *		          "rate": 0
 *		        },
 *		        {
 *		          "skillName": "Advertising Plan",
 *		          "rate": 0
 *		        },
 *		        {
 *		          "skillName": "Advertising strategy",
 *		          "rate": 0
 *		        },
 *		        {
 *		          "skillName": "Facebook marketing",
 *		          "rate": 0
 *		        },
 *		        {
 *		          "skillName": "Email marketing",
 *		          "rate": 0
 *		        }
 *		      ],
 *		      "languageSupport": [
 *		        "en"
 *		      ],
 *		      "serviceRating": 0,
 *		      "skillRate": null
 *		    }
 *		  ],
 *		  "totalPages": 3
 *		}
 *
 */


//get Home Expert

/**
 * @api {get} /experts/home/ get experts for home page
 * @apiName get Home expert
 * @apiVersion 1.0.0
 * @apiGroup Expert
 *
 * @query country
 *
 * @apiParamExample {json} Request-Example:
 *     curl "dev-tesse-demo.finalthemes.com:8000/api/experts/home"
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
    "success": true,
    "data": {
        "expertsByCountry": [],
        "expertsGlobal":[{
          {
                "_id": "58cc26baaf26811724e55abc",
                "cuid": "cj0e54t1t00bjkk7m0ftddrql",
                "fullName": "Leonardo Calcagno",
                "firstName": "Leonardo",
                "lastName": "Calcagno",
                "expert": 1,
                "categories": [
                    {
                        "industry": {
                            "industryID": "cizwmr4ts010xi3gdhtgh8ldd",
                            "title": "Business & Finance"
                        },
                        "department": {
                            "average": 0,
                            "total_rate": 0,
                            "departmentID": "cizwmsfw90111i3gdx3iiumnk",
                            "title": "Marketing & Advertising"
                        },
                        "skills": [
                            {
                                "average": 0,
                                "total_rate": 0,
                                "skill_ID": "Article Marketing",
                                "_id": "58cc2807af26811724e55b25"
                            },
                            {
                                "average": 0,
                                "total_rate": 0,
                                "skill_ID": "Content Marketing",
                                "_id": "58cc2807af26811724e55b24"
                            },
                            {
                                "average": 0,
                                "total_rate": 0,
                                "skill_ID": "Seasonal Marketing",
                                "_id": "58cc2807af26811724e55b23"
                            },
                            {
                                "average": 0,
                                "total_rate": 0,
                                "skill_ID": "Social Media Marketing",
                                "_id": "58cc2807af26811724e55b22"
                            }
                        ],
                        "catID": "cj0e5bmuv00cikk7mn9rv58ec",
                        "description": "",
                        "_id": "58cc27f9af26811724e55b1e"
                    }
                ],
                "rate": 0,
                "online": 0,
                "avatar": "/uploads/avatar/cj0e54t1t00bjkk7m0ftddrql-1489774523604.jpeg",
                "country": {
                    "ISO3": "CAN",
                    "ISO2": "CA",
                    "name": "Canada",
                    "cuid": "cizxjgdwm01vui3gd6763h36w"
                }
            }
        }]
        }
     }
 *
 */
