
const { MemoryStorage, UserState, TestAdapter, ConversationState } = require('botbuilder');
const { DialogSet, DialogTurnStatus, Dialog } = require('botbuilder-dialogs');
const { DialogTestClient } = require('botbuilder-testing');
const assert = require('assert');

const { UserPathwaysDialog } = require('../dialogs/userPathwaysDialog');

const userState = new UserState(new MemoryStorage());

describe('Test the userpathways quiz', function() {
    const quizTestCases = require('./quizTestCases');
    this.timeout(5000);

    quizTestCases.map(testData => {
        it(testData.name, async () => {
            const sut = new UserPathwaysDialog(userState);
            const inputParameters = {
                flow: {
                    transcriptLog: ''
                }
            };
            const client = new DialogTestClient('test', sut, inputParameters);

            for (let i = 0; i < testData.steps.length; i++) {
                const reply = await client.sendActivity(testData.steps[i][0]);
                console.log(reply);
                assert.strictEqual(reply ? reply.text : null, testData.steps[i][1]);
                for (let j = 2; j < testData.steps[i].length; j++) {
                    const nextReply = await client.getNextReply();
                    console.log(nextReply);
                    assert.strictEqual(nextReply ? nextReply.text : null, testData.steps[i][j]);
                }
                console.log(`Successfully passed test case for step ${ i }`);
            }
        });
    });
});
