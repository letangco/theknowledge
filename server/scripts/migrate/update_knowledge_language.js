'use strict';

import Knowledge from '../../models/knowledge';
import StringHelper from '../../util/StringHelper';

export default class UpdateLanguage {
    async start () {
        let knowledges = await Knowledge.find({}, {title: true}).exec();
        let languagePromise = knowledges.map(knowledge => {
            knowledge.language = StringHelper.detectLanguage(knowledge.title);
            return knowledge.save();
        });
        await Promise.all(languagePromise);
        console.log('update language complete');
    }
}
