/* A nuance to keep in mind is that there are no "correct" outputs as in it is constantly dependent
    on the state of the knowledge base and how trained the chatbot is. As such, answers over
    time may be different even if in response to the same question from the user
*/

const mentorsQuestionTest = {
    name: 'Asking a question about who should be a mentor',
    steps: [
        [
            'Any arbitrary text in order to kick start the QNA dialog',
            'Ask a question:'
        ],
        [
            'Who should be a mentor?',
            'Our mentors lead their interactions with students with the phrase, “How can I help you?” We welcome all Yale alumni and friends of Yale dedicated to advancing the university’s goal of creating a “learning environment that cultivates innovators, leaders, creators, and entrepreneurs in all fields and for all sectors of society.”',
            'Type anything to stop asking questions and submit another LUIS query'
        ]
    ]
};

module.exports = [
    mentorsQuestionTest
];
