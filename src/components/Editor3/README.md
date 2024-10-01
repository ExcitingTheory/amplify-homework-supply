# Editor

## Additional Schema

s3 paths are digests when using llm to generate. Otherwise when the file is uploaded, the filename is recorded and stored as a uuid in the db

```js
// option
identityId
├── uploaded
│   ├── audio
│   │   └── {datetime}.mp3
│   ├── images
│   │   └── {datetime}.png
│   └── videos
│       └── {datetime}.mpeg
├── generated
│   ├── feedback
│   │   ├── images
│   │   │   └── {digest}.png
│   │   ├── audio
│   │   │   └── {digest}.mp3
│   │   └── text
│   │       └── {digest}.txt
│   ├── videos
│   │   └── {digest}.mpeg
│   ├── images
│   │   └── {digest}.mpeg // check if it exists? if not, generate
│   ├── audio
│   │   └── {digest}.mp3
│   └── units // enable reusing of generated files for units?
│      └── {unitID}
│           ├── images
│           │   └── {digest}.png
│           ├── audio
│           │   └── {digest}.png
│           └── videos
│              └── {digest}.mpeg
└── grades
    └── {gradeID}
        ├── images
        │   └── {datetime}.png
        └── audio
            └── {datetime}.mp3
```

<!-- Propose another file path pattern

identityId/generated/audio/{digest}.mp3
identityId/generated/images/{digest}.png
identityId/generated/videos/{digest}.mpeg
identityId/generated/unit/images/{digest}.mpeg
identityId/generated/unit/audio/{datetime}.mp3
identityId/generated/unit/videos/{datetime}.mp3

identityId/uploaded/audio/{uuidv4}.mp3
identityId/uploaded/images/{uuidv4}.png
identityId/uploaded/videos/{uuidv4}.mpeg
identityId/uploaded/grades/{gradeID}/images/{datetime}.png


identityId/grades/{gradeID}/images/{datetime}.png
identityId/grades/{gradeID}/audio/{datetime}.mp3
 -->

Grades store user input audio and image files
Units store files generated from text snippets

## License

Parts of the following were derived from the following and are licensed under the MIT license: [lexical-playground](https://github.com/facebook/lexical/tree/main/packages/lexical-playground)

Other parts are licensed under the MIT license. See [LICENSE.md](./LICENSE.md) for more information.