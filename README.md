# Homework Supply

This is a web application built with Next.js, Material UI, and AWS Amplify gen 1. The application allows users to create interactive assignments, track their progress, and has language learning features. This can process audio and images uploaded during the assignment and provide feedback based on the expected content. The application also allows users to upload images and generate content from text snippets.

## Table of Contents

- [Features](#features)
- [Deploy AWS Amplify](#deploy-aws-amplify)
- [Installation](#installation)
- [Usage](#usage)
- [Requirements](#requirements)
    - [OpenAI API Key](#openai-api-key)
- [License](LICENSE.md)
- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)

## Features

1. Users can track their progress and performance over time.
2. Leverage LLMs to generate content from text snippets. Currently, this is limited to audio and image files.
3. LLM feedback allows users to dynamically compare their inputs with the expected content, real-time interactive assignments.
4. LLMs grade audio and drawings based on the expected content provided ahead of time by the instructor.
5. Allow users to upload their own audio and image files.
6. Allow users to create an account and login to the application.
7. Provide a dashboard that displays the user's progress and performance.
8. Allow users to browse and search for Japanese vocabulary words and phrases.
9. Provide flashcards and quizzes to help users learn and practice Japanese vocabulary.
10. Provide users with a simple text editor for generating new content.
11. Create learning groups and manage those learners' progress.
12. Assign content to groups.
13. Allow users to save their progress and resume learning at a later time.
14. Provide a mobile-responsive design that works well on both desktop and mobile devices.

## Deploy AWS Amplify

This application uses AWS Amplify to manage the backend services.  Button to deploy the application to your AWS account.

[![amplifybutton](https://oneclick.amplifyapp.com/button.svg)](https://console.aws.amazon.com/amplify/home#/deploy?repo=https://github.com/ExcitingTheory/amplify-homework-supply)

## Installation

1. Clone the repository: `git clone https://github.com/ExcitingTheory/amplify-homework-supply.git`
2. Install dependencies: `npm install`

## Usage

1. Start the development server: `npm run dev`
2. Open your browser and navigate to `http://localhost:3000`
3. Open Test Runner `npm run cypress:open`

## Requirements

1. Node.js
2. AWS Account
3. OpenAI API Key

### OpenAI API Key

This application uses the OpenAI API to generate content from text snippets. You will need to sign up for an API key at [OpenAI](https://platform.openai.com/signup). Once you have your API key, you can add it to the project using the amplify CLI.

```bash
amplify secret add openaiApiKey
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Contributing

Please read and follow our [Contributing Guidelines](CONTRIBUTING.md) to ensure a welcoming and inclusive environment.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to ensure a welcoming and inclusive environment.