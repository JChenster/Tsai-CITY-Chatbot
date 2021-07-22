const {
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    DialogSet,
    DialogTurnStatus,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');
const { UserProfile } = require('../userProfile');

// Dialog constants
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const NAME_PROMPT = 'NAME_PROMPT';
const USER_PROFILE = 'USER_PROFILE';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

// Quiz constants
const NUM_QUESTIONS = 4;
const QUIZ_KEY = [
    [3, 1, 5, 2, 4],
    [1, 2, 5, 4, 3],
    [2, 1, 5, 3, 4],
    [1, 3, 2, 5, 4]
];
const ENTREPRENEUR_KEY = 1;
const INTRAPRENEUR_KEY = 2;
const EXPLORER_KEY = 3;
const CIVIC_INNOVATOR_KEY = 4;
const ARTIST_KEY = 5;

class UserPathwaysDialog extends ComponentDialog {
    constructor(userState) {
        super('userPathwaysDialog');

        this.userProfile = userState.createProperty(USER_PROFILE);

        this.addDialog(new TextPrompt(NAME_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

        // This waterfall dialog asks users to answer questions in a quiz to understand their innovator profile
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.nameStep.bind(this),
            this.interestsStep.bind(this),
            this.dreamCareerStep.bind(this),
            this.roleModelStep.bind(this),
            this.engagementStep.bind(this),
            this.summaryStep.bind(this)
        ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async nameStep(step) {
        return await step.prompt(NAME_PROMPT, 'Please enter your name');
    }

    async interestsStep(step) {
        step.values.name = step.result;
        // Greet user
        await step.context.sendActivity(`Welcome ${ step.values.name }!`);
        await step.context.sendActivity(
            'How would you describe your interest in Tsai CITY?\n\n' +
            'A. I’m just curious\n\n' +
            'B. I have an idea I want help developing\n\n' +
            'C. I want to unlock more creative ideas\n\n' +
            'D. I want to think differently about my field\n\n' +
            'E. I want to learn how to make real change'
        );
        const answerChoices = await this.genenerateAnswerChoices(5);
        return await step.prompt(CHOICE_PROMPT, { choices: ChoiceFactory.toChoices(answerChoices) });
    }

    async dreamCareerStep(step) {
        step.values.interests = step.result;
        await step.context.sendActivity(
            'What’s your dream career path?\n\n' +
            'A. Founding a company or nonprofit\n\n' +
            'B. Joining a major organization and helping it think differently\n\n' +
            'C. Making pioneering creative work\n\n' +
            'D. Tackling injustices or systemic problems\n\n' +
            'E. I’m not sure'
        );
        const answerChoices = await this.genenerateAnswerChoices(5);
        return await step.prompt(CHOICE_PROMPT, { choices: ChoiceFactory.toChoices(answerChoices) });
    }

    async roleModelStep(step) {
        step.values.dreamCareer = step.result;
        await step.context.sendActivity(
            'Who would be your innovation role model?\n\n' +
            'A. A manager who leads a team in a bold new direction\n\n' +
            'B. An entrepreneur who disrupts an industry\n\n' +
            'C. A playwright who pushes the boundaries of contemporary theater\n\n' +
            'D. A lifelong learner who synthesizes ideas from different fields and communities\n\n' +
            'E. An activist who builds a movement from the ground up'
        );
        const answerChoices = await this.genenerateAnswerChoices(5);
        return await step.prompt(CHOICE_PROMPT, { choices: ChoiceFactory.toChoices(answerChoices) });
    }

    async engagementStep(step) {
        step.values.roleModel = step.result;
        await step.context.sendActivity(
            'What style of engaging with Tsai CITY most appeals to you?\n\n' +
            'A. I want to focus on my ideas, getting support to help me build them\n\n' +
            'B. I want to dabble and check out different opportunities\n\n' +
            'C. I want to take part in high-impact activities that help me build tangible skills\n\n' +
            'D. I want to connect with new people and perspectives to expand my thinking\n\n' +
            'E. I want to find strategies for solving the real-world problems I care most about'
        );
        const answerChoices = await this.genenerateAnswerChoices(5);
        return await step.prompt(CHOICE_PROMPT, { choices: ChoiceFactory.toChoices(answerChoices) });
    }

    async summaryStep(step) {
        step.values.engagement = step.result;
        // Determine quiz results
        // Convert quiz answers to what innovator profile they correspond to
        const quizAnswers = [step.values.interests, step.values.dreamCareer, step.values.roleModel, step.values.engagement];
        for (let i = 0; i < NUM_QUESTIONS; i++) {
            quizAnswers[i] = QUIZ_KEY[i][quizAnswers[i].index];
        }
        const profileScores = quizAnswers.reduce((acc, curr) => {
            acc[curr] = 100 / NUM_QUESTIONS + (typeof acc[curr] === 'undefined' ? 0 : acc[curr]);
            return acc;
        }, {});

        // Update user profile
        // userState now contains a UserProfile object with information on the user
        const userProfile = await this.userProfile.get(step.context, new UserProfile());
        userProfile.name = step.values.name;
        userProfile.entrepreneurScore = typeof profileScores[ENTREPRENEUR_KEY] === 'undefined' ? 0 : profileScores[ENTREPRENEUR_KEY];
        userProfile.intrapreneurScore = typeof profileScores[INTRAPRENEUR_KEY] === 'undefined' ? 0 : profileScores[INTRAPRENEUR_KEY];
        userProfile.explorerScore = typeof profileScores[EXPLORER_KEY] === 'undefined' ? 0 : profileScores[EXPLORER_KEY];
        userProfile.civicInnovatorScore = typeof profileScores[CIVIC_INNOVATOR_KEY] === 'undefined' ? 0 : profileScores[CIVIC_INNOVATOR_KEY];
        userProfile.artistScore = typeof profileScores[ARTIST_KEY] === 'undefined' ? 0 : profileScores[ARTIST_KEY];

        const summaryMessage =
            `Here are your innovator profile scores ${ userProfile.name }\n\n` +
            `Entrepreneur: ${ userProfile.entrepreneurScore }%\n\n` +
            `Intrapreneur: ${ userProfile.intrapreneurScore }%\n\n` +
            `Explorer: ${ userProfile.explorerScore }%\n\n` +
            `Civic Innovator: ${ userProfile.civicInnovatorScore }%\n\n` +
            `Artist: ${ userProfile.artistScore }%\n\n` +
            'Type \'Exit\' to return to the main menu';
        await step.context.sendActivity(summaryMessage);
        return await step.endDialog();
    }

    // Generates list of capital letters representing options
    async genenerateAnswerChoices(numChoices) {
        const arr = [...Array(numChoices).keys()];
        return arr.map(x => String.fromCharCode('A'.charCodeAt(0) + x));
    }
}

module.exports.UserPathwaysDialog = UserPathwaysDialog;
