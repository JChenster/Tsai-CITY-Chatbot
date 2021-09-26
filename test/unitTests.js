
const { MemoryStorage, UserState } = require('botbuilder');
const { DialogTestClient } = require('botbuilder-testing');
const assert = require('assert');

const { UserPathwaysDialog } = require('../dialogs/userPathwaysDialog');
const { QNADialog } = require('../dialogs/qnaDialog');

const userState = new UserState(new MemoryStorage());

const TEST_TIMEOUT = 10000;
const DUMMY_FLOW = {
    flow: {
        transcriptLog: ''
    }
};
const STEP_DELIMITER = '-'.repeat(100);

const runTestCase = async (client, testData) => {
    // Go through each step of a test case
    for (let i = 0; i < testData.steps.length; i++) {
        // 0th index of the user's input to the chatbot
        console.log('User said: ' + testData.steps[i][0]);
        const reply = await client.sendActivity(testData.steps[i][0]);
        console.log('Bot said: ' + reply.text);
        // 1rst index should be the bot's reply
        assert.strictEqual(reply ? reply.text : null, testData.steps[i][1]);
        // Anything afterwards is any extra expected bot output before the next
        for (let j = 2; j < testData.steps[i].length; j++) {
            const nextReply = await client.getNextReply();
            console.log('Bot said: ' + nextReply.text);
            assert.strictEqual(nextReply ? nextReply.text : null, testData.steps[i][j]);
        }
        console.log(`[Step ${ i }] Successfully passed test case!`);
        console.log(STEP_DELIMITER);
    }
};

// Test the user pathways quiz
describe('Test the user pathways quiz', function() {
    const quizTestCases = require('./quizTestCases');
    this.timeout(TEST_TIMEOUT);

    quizTestCases.map(testData => {
        // For each test case
        it(testData.name, async () => {
            const sut = new UserPathwaysDialog(userState);
            // Create a dummy flow transcript log that gets passed in
            const client = new DialogTestClient('test', sut, DUMMY_FLOW);
            runTestCase(client, testData);
        });
    });
});

// Test the QnA dialog
describe('Test the QnA dialog', function() {
    const qnaTestCases = require('./qnaTestCases');
    this.timeout(TEST_TIMEOUT);

    qnaTestCases.map(testData => {
        it(testData.name, async () => {
            const sut = new QNADialog();
            const client = new DialogTestClient('test', sut, DUMMY_FLOW);
            runTestCase(client, testData);
        });
    });
});
