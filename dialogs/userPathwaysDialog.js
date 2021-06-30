const { MessageFactory } = require('botbuilder');
const {
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    DialogSet,
    DialogTurnStatus,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');
const { UserProfile } = require('../userProfile')

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const NAME_PROMPT = 'NAME_PROMPT';
const USER_PROFILE = 'USER_PROFILE';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class UserPathwaysDialog extends ComponentDialog{
    constructor(userState) {
        super('userPathwaysDialog');

        this.userProfile = userState.createProperty(USER_PROFILE);

        this.addDialog(new TextPrompt(NAME_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

        // This waterfall dialog asks users to answer questions in a quiz to understand their innovator profile
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.nameStep.bind(this),
            this.interestsStep.bind(this),
            this.endStep.bind(this),
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

    async nameStep(step){
        return await step.prompt(NAME_PROMPT, 'Please enter your name')
    }

    async interestsStep(step){
        step.values.name = step.result;
        await step.context.sendActivity(`Welcome ${ step.result }!`)

        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'How would you describe your interest in Tsai CITY?',
            choices: ChoiceFactory.toChoices([
                'I’m just curious', 
                'I have an idea I want help developing',
                'I want to unlock more creative ideas',
                'I want to think differently about my field',
                'I want to learn how to make real change'
            ])
        });
    }

    async endStep(step){
        step.values.interests = step.result;
        return await step.endDialog();
    }
}

module.exports.UserPathwaysDialog = UserPathwaysDialog;