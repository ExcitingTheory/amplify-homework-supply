Homework Supply: public asset review
Organization and design critique of homework.supply, the Storybook, and .github/skills · 3 October 2026
The three assets describe three different products, and the weakest one, the marketing site, is the front door. The Storybook is the strongest asset, and nothing on the site links to it.
Across all three
Positioning drifts. The site says "The Teacher's Assistant You've Always Wanted", the README says "interactive elearning platform", and the Storybook says "interactive learning workspace".
The site undersells the product. It shows four generic cards (AI Enabled, Flexible Plans, Open Source, Personalized Feedback). The Storybook shows Kai and Sage, gamification, the recording studio, offline sync and peer review.
"Live demo" is not a demo. The README's link goes to the marketing page, which has no sign-in and only "Get Started (Private Beta)" buttons. The Storybook is the real demo, so point there.
homework.supply
No call to action above the fold. The first screen is a 375px logo image and a paragraph. The nav has Home, Videos, Services and Contact, with no sign-in, pricing or GitHub link.
Heading order is inverted. The H1 "Homework Supply" sits mid-page over the photo, after the H2 tagline, and repeats the logo.
Pricing reads oddly.
The Student plan lists "No Image generations", "No Audio generations" and "0 Credits" as features.
"Unlimited Cloud Storage" at $0.49 a month is hard to believe.
"Yearly" is preselected, so the first price a visitor sees is $95.88.
Copy is stale or off-audience.
The footer says © 2024.
Brand names are miscased: "Github", "Aws", "OpenAi".
"Get your training online quickly" is corporate-training language on a teacher product.
The newsletter block undercuts trust. The embedded form asks for consent to "Customized online advertising" on a product for students, and brings a second typeface (Open Sans next to Inter).
Sharing metadata is missing. The meta description is 1,133 characters, and there are no Open Graph, Twitter or canonical tags, so shared links will have no preview card.
Mobile holds up but is long. There is no horizontal overflow at 375px, but the page runs about 6,900px.
Storybook
The scale is impressive but lopsided. There are 1,098 stories under 19 top-level groups, and Gamification alone has 296 of them (27%).
The Welcome page contradicts the UI.
It says to choose Administrator, Instructor or Learner, but the widget offers Instructor, Learner and Translator.
It points to a "📚 Creating Lessons" section, but the group is called "✏️ Lesson Editor".
Scaffolding is still published. The default Example/Button, Header and Page stories ship, and the browser tab reads "storybook - Storybook".
The sidebar tail is unsorted. Pages, Admin, Collaborative Chat and Notifications fall after "Example". Two groups share 🛠️ and two share 💬.
Naming is mixed. "WorkbookInviteShare", "JoinWorkbookDialog" and "RecordingStudio2" sit beside Title Case names, and only some groups have a "Components" subfolder.
Emoji are in the story IDs. That is why links are percent-encoded. initialStoryId in manager.ts omits the emoji, so it matches nothing; the root URL lands on Welcome only because of story order.
The Welcome page is a story, not a doc. It opens with an empty Controls panel taking a third of the screen, skips from H2 to H6, and its own accessibility tab reports 3 violations.
Themes clash. With a dark system theme, the Storybook chrome goes dark while the canvas stays light.
.github/skills
The SKILL.md files are good. Each is 14–15 lines, bounded, and has explicit stop conditions.
The README is out of date.
It lists 7 of the 9 skills, omitting console-crawl-audit and docblock-backfill.
All three of its documentation links are dead.
It says feature-development-cycle runs "Always"; the skill itself says to use a full plan only for multi-surface work.
Descriptions say what, not when. "Bounded docblock audit and backfill for explicitly requested files" gives an agent no trigger. Several skills also say "run the existing script" without naming one.
Scripts are duplicated.
Four files exist identically at the skill root and in scripts/.
validate-component-mocks.ts and generate-missing-metadata-only.ts each exist in two skills, and the copies have diverged.
The validator is not wired in. No package.json script was found that runs validate-skills.ts.
Old prompts sit beside their replacements. .github/prompts keeps each v1 next to its v2; the Storybook one is 1,010 lines against 15.
Run output is committed. That includes .github/logs/agent-operations.log, a 31 MB storybook-run.log and test..log at the repo root, and an empty proxy.ts.
What to fix first
Rewrite the site hero around one positioning line, with a primary button to the Storybook or a real demo.
Fix the Welcome page's roles and section names, and delete the Example stories.
Regenerate the skills README from the SKILL.md frontmatter, and delete the v1 prompts and committed logs.
Scope of this review
The desktop site was reviewed in full, but only the top of the mobile layout. In the Storybook only the Welcome page was rendered; the rest comes from its story index and the repository (commit 19aafe6, 2 October 2026).
