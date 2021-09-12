/*
Each step can have 2+ arguments
The first 2 are treated as user input and expected bot chatbot
After that, those are further bot chatbot outputs expected before the next user input
*/
const answerChoicePrompt = '\n\n   1. A\n   2. B\n   3. C\n   4. D\n   5. E';

module.exports = [
    {
        name: 'Generic run of quiz',
        steps: [
            [
                'Arbitrary text, can be anything blah blah blah',
                'Please enter your name'
            ],
            [
                'John Doe',
                'Welcome John Doe! There will be 4 multiple choice questions we need your answer to.',
                'How would you describe your interest in Tsai CITY?\n\n' +
                'A. I’m just curious\n\n' +
                'B. I have an idea I want help developing\n\n' +
                'C. I want to unlock more creative ideas\n\n' +
                'D. I want to think differently about my field\n\n' +
                'E. I want to learn how to make real change',
                answerChoicePrompt
            ],
            [
                'C',
                'What’s your dream career path?\n\n' +
                'A. Founding a company or nonprofit\n\n' +
                'B. Joining a major organization and helping it think differently\n\n' +
                'C. Making pioneering creative work\n\n' +
                'D. Tackling injustices or systemic problems\n\n' +
                'E. I’m not sure',
                answerChoicePrompt
            ],
            [
                'D',
                'Who would be your innovation role model?\n\n' +
                'A. A manager who leads a team in a bold new direction\n\n' +
                'B. An entrepreneur who disrupts an industry\n\n' +
                'C. A playwright who pushes the boundaries of contemporary theater\n\n' +
                'D. A lifelong learner who synthesizes ideas from different fields and communities\n\n' +
                'E. An activist who builds a movement from the ground up',
                answerChoicePrompt
            ],
            [
                'D',
                'What style of engaging with Tsai CITY most appeals to you?\n\n' +
                'A. I want to focus on my ideas, getting support to help me build them\n\n' +
                'B. I want to dabble and check out different opportunities\n\n' +
                'C. I want to take part in high-impact activities that help me build tangible skills\n\n' +
                'D. I want to connect with new people and perspectives to expand my thinking\n\n' +
                'E. I want to find strategies for solving the real-world problems I care most about',
                answerChoicePrompt
            ],
            [
                'B',
                'Here are your innovator profile scores John Doe\n' +
                '\n' +
                'Entrepreneur: 0%\n' +
                '\n' +
                'Intrapreneur: 0%\n' +
                '\n' +
                'Explorer: 50%\n' +
                '\n' +
                'Civic Innovator: 25%\n' +
                '\n' +
                'Artist: 25%\n' +
                '\n'
            ]
        ]
    }
];
