function (){return db.users.aggregate([{$project:{cuid:"$cuid",serviceTotalRate:{$add:["$serviceRating.expertCommunication","$serviceRating.serviceAsDescribed","$serviceRating.professional","$serviceRating.notProlong"]},average:Number("$categories.skills.average"),totalRate:Number("$categories.skills.totalRate"),totalConnection:"$totalConnection",skills:"$categories.skills.skill_ID",categories:"$categories",serviceRating:"$serviceRating",skillTags:"$categories.skills",country:"$country",online:"$online",country:"$country",languageSupport:"$languageSupport",priceCall:"$priceCall",priceChat:"$priceChat",avatar:"$avatar",lastName:"$lastName",firstName:"$firstName",userName:"$userName",count:{$literal:1},rate:"$rate",expert:"$expert",active:"$active",totalRateIC:"$totalRate"}},{$unwind:"$categories"},{$unwind:"$categories.skills"},{$match:{$and:[{cuid:{$in:["cj0dij2y2000ekk7mxmhbhwy6","cj0dl08pn0015kk7myjy7mz2y"]}}]}},{$project:{cuid:"$cuid",serviceRating:"$serviceRating",serviceTotalRate:{$add:["$serviceRating.expertCommunication","$serviceRating.serviceAsDescribed","$serviceRating.professional","$serviceRating.notProlong"]},average:"$categories.skills.average",totalRate:Number("$categories.skills.totalRate"),totalConnection:"$totalConnection",skills:"$categories.skills.skill_ID",categories:"$categories.department.title",skillTags:"$skillTags",country:"$country",languageSupport:"$languageSupport",online:"$online",priceCall:"$priceCall",priceChat:"$priceChat",avatar:"$avatar",lastName:"$lastName",firstName:"$firstName",userName:"$userName",count:{$literal:1},rate:"$rate",expert:"$expert",active:"$active",totalRateIC:"$totalRate"}},{$unwind:"$skillTags"},{$unwind:"$skillTags"},{$group:{_id:{cuid:"$cuid",country:"$country",languageSupport:"$languageSupport",online:"$online",priceCall:"$priceCall",priceChat:"$priceChat",avatar:"$avatar",lastName:"$lastName",firstName:"$firstName",userName:"$userName",serviceRating:"$serviceRating",serviceTotalRate:{$add:["$serviceRating.expertCommunication","$serviceRating.serviceAsDescribed","$serviceRating.professional","$serviceRating.notProlong"]},totalConnection:"$totalConnection",rate:"$rate",expert:"$expert",active:"$active",totalRateIC:"$totalRateIC"},skillTags:{$addToSet:"$skillTags"},average:{$sum:"$average"},totalRate:{$sum:"$totalRate"},skills:{$addToSet:"$skills"},categories:{$addToSet:{title:"$categories"}},point:{$sum:{$multiply:["$average","$totalRate"]}},count:{$sum:"$count"}}},{$project:{_id:"$_id",totalRate:"$totalRate",point:"$point",skills:[],categories:"$categories",skillTags:"$skillTags",Experience:"$Experience",numberOfConnection:"$numberOfConnection",rate:"$rate",expert:"$expert",active:"$active",totalRateIC:"$totalRateIC",serviceRating:"$serviceRating",serviceTotalRate:{$add:["$serviceRating.expertCommunication","$serviceRating.serviceAsDescribed","$serviceRating.professional","$serviceRating.notProlong"]},rank:{$sum:{$subtract:[{$divide:[{$sum:"$average"},{$sum:"$count"}]},{$mod:[{$divide:[{$sum:"$average"},{$sum:"$count"}]},1]}]}}}}]).toArray()}