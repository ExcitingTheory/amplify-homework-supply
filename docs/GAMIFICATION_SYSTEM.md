# Gamification & Achievement System

**Last Updated**: January 9, 2026  
**Status**: Design Phase  
**Theme**: Language Learning Mastery Journey

## Table of Contents

1. [Overview](#overview)
2. [Achievement Categories](#achievement-categories)
3. [Point System (XP)](#point-system-xp)
4. [Badge & Award Types](#badge--award-types)
5. [Leaderboards & Social Features](#leaderboards--social-features)
6. [Progress Visualization](#progress-visualization)
7. [Reward Mechanisms](#reward-mechanisms)
8. [Data Models](#data-models)
9. [UI Components](#ui-components)
10. [Implementation Phases](#implementation-phases)

---

## Overview

### Design Philosophy

**Goal**: Transform language learning from a chore into an engaging journey with:
- ✨ Instant gratification (micro-achievements)
- 🏆 Long-term goals (mastery milestones)
- 🤝 Social motivation (leaderboards, collaboration)
- 🎯 Clear progression paths (skill trees)
- 🎉 Celebration moments (unlock animations, sound effects)

### Core Metrics

Players earn recognition through:
- **Experience Points (XP)**: Granular progress on everything
- **Badges**: Visual achievements for specific accomplishments
- **Streaks**: Daily consistency rewards
- **Mastery Levels**: Skill-based progression (Beginner → Master)
- **Titles**: Earned honorifics displayed by username
- **Leaderboard Ranks**: Competitive positioning

---

## Achievement Categories

### 1. Learning Milestones 📚

**Vocabulary Achievements**
- 🌱 **First Words** (5 words learned) - 50 XP
- 📖 **Word Explorer** (25 words) - 100 XP
- 💬 **Conversationalist** (100 words) - 250 XP
- 🗣️ **Fluent Speaker** (500 words) - 1,000 XP
- 🎓 **JLPT N5 Vocab Master** (All N5 words) - 2,500 XP
- 🏅 **JLPT N4 Vocab Master** (All N4 words) - 5,000 XP
- ⭐ **Kanji Collector** (100 kanji) - 1,500 XP
- 🌟 **Kanji Master** (500 kanji) - 7,500 XP

**Unit Completion**
- 🎯 **First Steps** (Complete first unit) - 100 XP
- 📘 **Lesson Learner** (Complete 5 units) - 300 XP
- 🎓 **Dedicated Student** (Complete 25 units) - 1,000 XP
- 👨‍🎓 **Scholar** (Complete 100 units) - 5,000 XP
- 🏆 **Perfect Score** (100% on any unit) - 200 XP + "Perfectionist" badge
- ⚡ **Speed Learner** (Complete unit in under 10 min with >80% accuracy) - 300 XP

**Question Bank Mastery**
- 🎯 **Quiz Taker** (Answer 100 questions) - 150 XP
- 💯 **Perfect Practice** (10 questions in a row correct) - 100 XP
- 🔥 **Quiz Master** (1,000 questions answered) - 1,500 XP
- 🧠 **Einstein** (500 questions answered with >90% accuracy) - 2,000 XP

### 2. Consistency & Streaks 🔥

**Daily Streaks**
- 📅 **Day One** (1 day streak) - 10 XP
- 🔥 **Getting Warmed Up** (3 day streak) - 50 XP + Flame badge
- ⚡ **On Fire** (7 day streak) - 150 XP + Animated flame badge
- 💪 **Unstoppable** (30 day streak) - 500 XP + Epic flame badge
- 🌟 **Legendary** (100 day streak) - 2,000 XP + "Sensei" title
- 👑 **Immortal** (365 day streak) - 10,000 XP + Crown badge + "Grand Master" title

**Weekly Goals**
- 📊 **Weekend Warrior** (Complete 5 units on weekend) - 200 XP
- 🎯 **Weekly Champion** (Hit 1,000 XP in one week) - 300 XP
- 💼 **Workweek Learner** (Study every weekday) - 250 XP

**Monthly Achievements**
- 📆 **Monthly Milestone** (Complete 20 units in a month) - 500 XP
- 🌙 **Night Owl** (Study past midnight 5 times in a month) - 150 XP
- ☀️ **Early Bird** (Study before 7 AM 5 times) - 150 XP

### 3. Accuracy & Mastery 🎯

**Performance-Based**
- 🎯 **Sharp Shooter** (80% average accuracy across 10 units) - 300 XP
- 💯 **Flawless** (100% on 5 different units) - 500 XP
- 🏅 **Gold Standard** (90%+ accuracy on 25 units) - 1,000 XP
- ⚡ **First Try Success** (Get question right on first attempt 50 times) - 200 XP
- 🧠 **No Hints Needed** (Complete unit without using hints) - 150 XP

**Improvement Tracking**
- 📈 **Getting Better** (Improve quiz score by 20% on retry) - 100 XP
- 🔄 **Persistent Learner** (Retry failed quiz and get 90%+) - 150 XP
- 💪 **Comeback Kid** (Go from <50% to 100% on same unit) - 300 XP

### 4. Audio & Pronunciation 🎤

**Recording Achievements**
- 🎙️ **First Recording** (Submit first audio) - 50 XP
- 🗣️ **Voice Actor** (50 audio recordings) - 300 XP
- 🎬 **Audio Master** (500 recordings) - 2,000 XP
- ⭐ **Perfect Pitch** (AI rates recording 95%+ accuracy) - 200 XP
- 🏆 **Native Speaker** (100 recordings with 90%+ AI rating) - 1,500 XP

**Listening Practice**
- 👂 **Attentive Listener** (Listen to 100 audio files) - 200 XP
- 🎧 **Audio Buff** (Listen to 1,000 audio files) - 1,000 XP
- ⏱️ **Marathon Listener** (Listen to 1 hour of audio in one session) - 300 XP

### 5. Social & Collaborative 🤝

**Class Participation**
- 👥 **Team Player** (Join a section) - 50 XP
- 🎓 **Class Leader** (Top score in section for a week) - 400 XP + "Class Champion" badge
- 🤝 **Helpful Student** (Share content with 5 classmates) - 150 XP
- 👨‍🏫 **Teacher's Pet** (Get 5 positive instructor comments) - 300 XP

**Competitive**
- 🥇 **Gold Medalist** (Rank #1 on weekly leaderboard) - 1,000 XP + Gold trophy
- 🥈 **Silver Medalist** (Rank #2-3) - 500 XP + Silver trophy
- 🥉 **Bronze Medalist** (Rank #4-10) - 250 XP + Bronze trophy
- 🎯 **Giant Slayer** (Beat someone ranked higher than you) - 200 XP
- 👑 **Undefeated** (Hold #1 rank for 4 weeks straight) - 2,000 XP + Crown

**Community**
- ⭐ **Content Creator** (Upload 10 custom study sets) - 500 XP
- 💡 **Innovator** (Create unit that gets used by 50+ students) - 1,000 XP
- 🌟 **Influencer** (Get 100 upvotes on your content) - 750 XP

### 6. Creative & Exploration 🎨

**Content Creation**
- ✍️ **First Creation** (Create your first custom unit) - 100 XP
- 🎨 **Designer** (Upload 10 custom images) - 200 XP
- 📝 **Author** (Create 5 complete units) - 500 XP
- 🎭 **Multimedia Master** (Unit with text, images, audio, and video) - 300 XP

**Tool Usage**
- 🤖 **AI Assistant** (Use chat sidebar 10 times) - 100 XP
- 🔍 **Explorer** (Use semantic search 50 times) - 150 XP
- 📊 **Data Analyst** (View analytics dashboard 5 times) - 50 XP
- 🎨 **Sketch Artist** (Use drawing tool 20 times) - 100 XP
- 📄 **Document Hunter** (Analyze 5 PDFs) - 200 XP

### 7. Speed & Efficiency ⚡

**Time-Based**
- ⚡ **Lightning Fast** (Complete unit in top 10% time while maintaining 80%+ accuracy) - 300 XP
- 🏃 **Speed Demon** (Answer 50 questions in under 5 minutes) - 200 XP
- ⏱️ **Time Trial Master** (Complete 10 units under target time) - 500 XP
- 🚀 **Rocket Learner** (Earn 500 XP in one day) - 400 XP

**Efficiency**
- 🎯 **One Shot Wonder** (Complete unit with zero mistakes) - 250 XP
- 💎 **Precision** (90%+ first-attempt accuracy on 100 questions) - 400 XP
- 🏅 **Efficient Learner** (High XP per minute ratio over 10 units) - 300 XP

### 8. Special & Seasonal 🎉

**Seasonal Events**
- 🎃 **Halloween Scholar** (Complete 5 units during October) - 200 XP
- 🎄 **Holiday Hero** (Study 7 days during December break) - 300 XP
- 🎆 **New Year Resolver** (10 day streak starting Jan 1) - 500 XP
- 🌸 **Spring Bloomer** (Complete 20 units in spring semester) - 400 XP

**Cultural Milestones**
- 🎌 **Hinamatsuri** (Study on Girls' Day) - 50 XP
- 🎏 **Kodomo no Hi** (Study on Children's Day) - 50 XP
- 🌕 **Tsukimi** (Study during harvest moon) - 50 XP
- 🗻 **Fujisan Climber** (Complete "Mount Fuji" challenge course) - 1,000 XP

**Easter Eggs**
- 🐱 **Neko Lover** (Find all hidden cat references) - 500 XP + "Cat Whisperer" badge
- 🍜 **Ramen Enthusiast** (Complete all food-related units) - 300 XP
- 🗾 **Geography Buff** (Complete all prefecture units) - 600 XP
- 🎮 **Gamer** (Find secret Konami code easter egg) - 100 XP

### 9. Long-Term Mastery 🏆

**Skill Trees**
- 🌳 **Grammar Novice** (Complete basic grammar branch) - 500 XP
- 🌲 **Grammar Expert** (Complete advanced grammar branch) - 2,000 XP
- 📚 **Reading Rookie** (Complete basic reading branch) - 500 XP
- 📖 **Reading Scholar** (Complete advanced reading) - 2,000 XP
- 🎧 **Listening Learner** (Complete basic listening) - 500 XP
- 👂 **Listening Expert** (Complete advanced listening) - 2,000 XP
- 🗣️ **Speaking Starter** (Complete basic speaking) - 500 XP
- 💬 **Speaking Master** (Complete advanced speaking) - 2,000 XP

**Ultimate Achievements**
- 👑 **Language Legend** (Earn all other achievements) - 50,000 XP + Legendary badge
- 🌟 **Polyglot** (Master multiple language tracks) - 25,000 XP
- 🎓 **PhD Scholar** (Complete 500 units with 85%+ avg) - 20,000 XP
- 💎 **Diamond Tier** (Reach 100,000 total XP) - Exclusive title + avatar frame

---

## Point System (XP)

### XP Awards

**Base Activities**
```javascript
const XP_VALUES = {
  // Questions
  questionCorrectFirstTry: 10,
  questionCorrectSecondTry: 5,
  questionCorrectThirdTry: 2,
  
  // Units
  unitComplete: 100,
  unitPerfectScore: 200, // bonus for 100%
  unitSpeedBonus: 50, // complete under target time
  unitRetryImprovement: 30, // per 10% improvement
  
  // Vocabulary
  wordLearned: 5,
  word25ReviewedInRow: 25,
  wordMastered: 20, // 5+ correct reviews
  
  // Audio
  audioRecording: 15,
  audioHighQuality: 30, // AI rates 90%+
  audioListened: 2,
  
  // Daily
  dailyLogin: 10,
  dailyGoalMet: 50,
  weeklyGoalMet: 200,
  
  // Social
  commentPosted: 5,
  helpfulComment: 25, // instructor marks as helpful
  contentShared: 10,
  contentUpvoted: 3,
  
  // Streaks (daily bonus multiplier)
  streak7Days: 1.1, // 10% XP boost
  streak30Days: 1.25, // 25% XP boost
  streak100Days: 1.5, // 50% XP boost
};
```

### Level System

**Level Progression** (exponential curve):
```javascript
const calculateLevel = (totalXP) => {
  // Level = floor(sqrt(XP / 100))
  return Math.floor(Math.sqrt(totalXP / 100));
};

const xpForLevel = (level) => {
  // XP needed = (level^2) * 100
  return Math.pow(level, 2) * 100;
};

// Examples:
// Level 1: 100 XP
// Level 2: 400 XP (300 more)
// Level 5: 2,500 XP
// Level 10: 10,000 XP
// Level 25: 62,500 XP
// Level 50: 250,000 XP (Grand Master)
// Level 100: 1,000,000 XP (Legend)
```

**Level Titles**:
```javascript
const LEVEL_TITLES = {
  1: "Beginner",
  5: "Novice",
  10: "Student",
  15: "Apprentice",
  20: "Practitioner",
  25: "Scholar",
  30: "Expert",
  35: "Master",
  40: "Grand Master",
  45: "Sage",
  50: "Sensei",
  60: "Legend",
  70: "Mythic",
  80: "Immortal",
  90: "Transcendent",
  100: "Deity",
};
```

### XP Multipliers

**Combo System** (back-to-back activity bonuses):
- ✨ **2x Combo**: Answer 5 questions correctly in a row → 1.2x XP
- 🔥 **3x Combo**: 10 in a row → 1.5x XP
- 💥 **4x Combo**: 20 in a row → 2x XP
- ⚡ **5x Combo**: 50 in a row → 3x XP

**Time-Based Multipliers**:
- 🌅 **Early Bird Bonus** (Study 5-8 AM): 1.2x XP
- 🌙 **Night Owl Bonus** (Study 10 PM-1 AM): 1.2x XP
- 📅 **Weekend Warrior** (Study on weekends): 1.15x XP
- 🎉 **Birthday Bonus** (Study on your birthday): 2x XP

**Event Multipliers**:
- 🎊 **Double XP Weekend**: 2x all XP
- 🎁 **Holiday Bonus**: 1.5x XP during school breaks
- 🏆 **Challenge Mode**: 3x XP for difficult units

---

## Badge & Award Types

### Visual Badge System

**Badge Tiers** (same achievement, escalating rarity):

**Example: Streak Badges**
```
🔥 Bronze Flame (7 days) - Bronze border, small flame
🔥 Silver Flame (30 days) - Silver border, medium flame
🔥 Gold Flame (100 days) - Gold border, large animated flame
🔥 Platinum Flame (365 days) - Platinum border, rainbow flame with particle effects
```

**Badge Categories & Examples**:

1. **Learning Progress Badges** (📚)
   - First Words (seedling icon)
   - Word Explorer (magnifying glass)
   - Conversationalist (speech bubble)
   - Vocab Master (book with stars)

2. **Streak Badges** (🔥)
   - Day One (single flame)
   - Week Warrior (7 flames)
   - Month Master (calendar)
   - Year Hero (trophy with 365)

3. **Accuracy Badges** (🎯)
   - Sharp Shooter (bullseye)
   - Perfectionist (100% icon)
   - Flawless (diamond)
   - Einstein (brain with lightbulb)

4. **Speed Badges** (⚡)
   - Lightning Fast (lightning bolt)
   - Speed Demon (running figure)
   - Time Trial (stopwatch)
   - Rocket (rocket ship)

5. **Audio Badges** (🎤)
   - First Words Spoken (microphone)
   - Voice Actor (recording studio)
   - Perfect Pitch (musical note)
   - Native Speaker (flag + microphone)

6. **Social Badges** (🤝)
   - Team Player (group icon)
   - Class Champion (trophy + people)
   - Helpful Student (helping hand)
   - Content Creator (pencil + star)

7. **Competitive Badges** (🏆)
   - Gold Trophy (1st place)
   - Silver Trophy (2nd-3rd)
   - Bronze Trophy (4th-10th)
   - Crown (sustained #1)

8. **Special Badges** (🌟)
   - Easter Egg badges (hidden surprises)
   - Seasonal badges (holiday-themed)
   - Event badges (limited time)
   - Legacy badges (no longer obtainable)

### Badge Display

**Badge Showcase** (profile page):
```jsx
<BadgeShowcase>
  <FeaturedBadge badge={mostRecentBadge} size="large" />
  
  <BadgeGrid>
    {earnedBadges.map(badge => (
      <BadgeCard
        key={badge.id}
        badge={badge}
        earned={true}
        earnedDate={badge.earnedAt}
        rarity={badge.rarity}
        onClick={() => showBadgeDetails(badge)}
      />
    ))}
    
    {lockedBadges.map(badge => (
      <BadgeCard
        key={badge.id}
        badge={badge}
        earned={false}
        progress={badge.progress} // e.g., "47/100 words"
        tooltip={badge.hint}
      />
    ))}
  </BadgeGrid>
</BadgeShowcase>
```

**Badge Animation** (unlock moment):
```jsx
const BadgeUnlockAnimation = ({ badge }) => {
  return (
    <Modal open={true}>
      <AnimatedBadge
        badge={badge}
        animation="flip-in"
        sparkles={true}
        sound="achievement-unlock.mp3"
      />
      <Confetti colors={badge.rarityColors} />
      <Typography variant="h4">Achievement Unlocked!</Typography>
      <Typography variant="h5">{badge.name}</Typography>
      <Typography>{badge.description}</Typography>
      <XPGain amount={badge.xpReward} animated={true} />
    </Modal>
  );
};
```

---

## Leaderboards & Social Features

### Leaderboard Types

**1. Global Leaderboard** (All Users)
- Top 100 by total XP
- Filter by: This Week, This Month, All Time
- Show: Rank, Avatar, Name, Title, XP, Level, Streak

**2. Section Leaderboard** (Class-specific)
- Top students in each section
- Encourages class competition
- Instructor can feature "Student of the Week"

**3. Friends Leaderboard** (Social Circle)
- Compare with added friends
- Privacy-friendly competition

**4. Challenge Leaderboards** (Event-based)
- Limited-time challenges
- Weekly vocabulary sprint
- Monthly unit marathon
- Reset each period

**5. Skill-Specific Leaderboards**
- Top in vocabulary
- Top in pronunciation (AI scores)
- Top in quiz accuracy
- Top in content creation

### Leaderboard UI

```jsx
<LeaderboardPanel>
  <Tabs>
    <Tab label="Global" />
    <Tab label="My Class" />
    <Tab label="Friends" />
    <Tab label="This Week" />
  </Tabs>
  
  <LeaderboardTable>
    {entries.map((entry, index) => (
      <LeaderboardRow
        key={entry.userId}
        rank={index + 1}
        isCurrentUser={entry.userId === session.userId}
        medal={index < 3 ? getMedal(index) : null}
      >
        <RankBadge rank={index + 1} />
        <Avatar src={entry.avatar} level={entry.level} />
        <UserInfo>
          <Name>{entry.name}</Name>
          <Title>{entry.title}</Title>
        </UserInfo>
        <Stats>
          <XP>{entry.xp.toLocaleString()} XP</XP>
          <Streak>🔥 {entry.streak} days</Streak>
        </Stats>
        <TrendIndicator change={entry.rankChange} />
      </LeaderboardRow>
    ))}
  </LeaderboardTable>
  
  {/* Current user always visible at bottom */}
  <StickyFooter>
    <CurrentUserRank rank={currentUserRank} />
  </StickyFooter>
</LeaderboardPanel>
```

### Social Features

**Friend System**:
- Add friends by username or class code
- See friends' recent achievements in feed
- Challenge friends to learning duels
- Gift XP boosts to struggling friends

**Activity Feed**:
```jsx
<ActivityFeed>
  {activities.map(activity => (
    <ActivityCard>
      <Avatar user={activity.user} />
      <ActivityText>
        <strong>{activity.user.name}</strong> {activity.action}
      </ActivityText>
      <Timestamp>{activity.timestamp}</Timestamp>
      
      {/* Examples: */}
      {/* "earned the Gold Flame badge 🔥" */}
      {/* "reached Level 25 (Scholar)!" */}
      {/* "completed 100 units 🎓" */}
      {/* "took #1 on the weekly leaderboard 👑" */}
      
      <LikeButton onClick={() => celebrate(activity)} />
    </ActivityCard>
  ))}
</ActivityFeed>
```

**Learning Duels**:
```jsx
// Challenge a friend to complete same unit
const createDuel = async (friendId, unitId) => {
  await DataStore.save(new LearningDuel({
    challengerId: session.userId,
    challengedId: friendId,
    unitID: unitId,
    status: 'pending',
    prize: '100 XP',
  }));
  
  // Friend gets notification
  // Both complete unit
  // Winner gets XP + "Duel Winner" badge
};
```

---

## Progress Visualization

### Skill Tree

**Interactive Skill Map** (branching progression):
```
                    🏆 JLPT N1 Master
                         |
        ┌────────────────┼────────────────┐
        |                |                |
    Advanced         Advanced         Advanced
    Grammar          Kanji            Reading
        |                |                |
        ├────────────────┼────────────────┤
        |                |                |
  Intermediate     Intermediate     Intermediate
    Grammar          Kanji            Reading
        |                |                |
        └────────────────┼────────────────┘
                         |
                    🌱 Hiragana
```

**Node States**:
- ✅ **Completed** (Green, checkmark)
- 🔓 **Available** (Yellow, unlocked)
- 🔒 **Locked** (Gray, requires prerequisites)
- ⭐ **Mastered** (Gold star, 100% completion)

**Skill Tree Component**:
```jsx
<SkillTree>
  {skills.map(skill => (
    <SkillNode
      key={skill.id}
      skill={skill}
      status={getSkillStatus(skill)}
      progress={skill.unitsCompleted / skill.totalUnits}
      onClick={() => viewSkillDetails(skill)}
      connections={skill.prerequisites}
    >
      <SkillIcon src={skill.icon} />
      <SkillName>{skill.name}</SkillName>
      <ProgressBar value={skill.progress} />
      {skill.isMastered && <GoldStar />}
    </SkillNode>
  ))}
</SkillTree>
```

### Progress Dashboard

**Personal Stats Page**:
```jsx
<DashboardGrid>
  {/* XP Progress */}
  <XPCard>
    <CircularProgress
      value={(currentXP - levelXP) / (nextLevelXP - levelXP) * 100}
      size={200}
      thickness={8}
    >
      <Typography variant="h3">Level {level}</Typography>
      <Typography>{levelTitle}</Typography>
    </CircularProgress>
    <XPDisplay>
      {currentXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
    </XPDisplay>
  </XPCard>
  
  {/* Streak Calendar */}
  <StreakCard>
    <Typography variant="h6">🔥 {currentStreak} Day Streak</Typography>
    <Calendar
      data={activityData}
      highlightStreaks={true}
      theme="github"
    />
  </StreakCard>
  
  {/* Skills Radar Chart */}
  <SkillsCard>
    <Typography variant="h6">Skill Balance</Typography>
    <RadarChart
      data={{
        vocabulary: vocabularyScore,
        grammar: grammarScore,
        reading: readingScore,
        listening: listeningScore,
        speaking: speakingScore,
        writing: writingScore,
      }}
    />
  </SkillsCard>
  
  {/* Achievement Progress */}
  <AchievementCard>
    <Typography variant="h6">
      Achievements: {earnedCount}/{totalCount}
    </Typography>
    <ProgressBar value={earnedCount / totalCount * 100} />
    <AchievementGrid>
      {nextAchievements.map(achievement => (
        <MiniAchievement
          achievement={achievement}
          progress={achievement.progress}
        />
      ))}
    </AchievementGrid>
  </AchievementCard>
  
  {/* Study Stats */}
  <StatsCard>
    <StatRow>
      <StatLabel>Total Study Time</StatLabel>
      <StatValue>{formatTime(totalStudyTime)}</StatValue>
    </StatRow>
    <StatRow>
      <StatLabel>Units Completed</StatLabel>
      <StatValue>{unitsCompleted}</StatValue>
    </StatRow>
    <StatRow>
      <StatLabel>Average Accuracy</StatLabel>
      <StatValue>{averageAccuracy}%</StatValue>
    </StatRow>
    <StatRow>
      <StatLabel>Longest Streak</StatLabel>
      <StatValue>{longestStreak} days 🔥</StatValue>
    </StatRow>
  </StatsCard>
</DashboardGrid>
```

### Mini-Games Progress

**Vocabulary Battle** (SRS-based game):
- Duel against AI or friends
- Time-limited word recall
- Winner gets XP multiplier

**Kanji Quest** (RPG-style progression):
- Each kanji is a "monster" to defeat
- Radicals are "items" to collect
- Boss battles for milestone kanji

**Sentence Builder** (Drag-and-drop):
- Construct sentences from word bank
- Time challenge mode
- Grammar pattern mastery

---

## Reward Mechanisms

### Tangible Rewards

**Avatar Customization** (unlockable cosmetics):
```javascript
const AVATAR_REWARDS = {
  level5: { type: 'frame', name: 'Bronze Frame' },
  level10: { type: 'frame', name: 'Silver Frame' },
  level25: { type: 'frame', name: 'Gold Frame' },
  level50: { type: 'frame', name: 'Platinum Frame' },
  
  streak7: { type: 'accessory', name: 'Flame Emoji' },
  streak30: { type: 'accessory', name: 'Crown' },
  
  perfectScore: { type: 'badge', name: 'Perfect Student Pin' },
  
  // Cultural items
  hiraganaComplete: { type: 'background', name: 'Cherry Blossom BG' },
  katakanaComplete: { type: 'background', name: 'Mount Fuji BG' },
  jlptN5: { type: 'avatar', name: 'Samurai Avatar' },
};
```

**Theme Unlocks**:
- Dark mode themes (Level 10)
- Seasonal themes (Holiday events)
- Cultural themes (JLPT completion)
- Custom color schemes (Achievement milestones)

**Audio Rewards**:
- Unlock different "ping" sounds for correct answers
- Celebration sound effects for achievements
- Background music tracks (Lo-fi Study Beats, Traditional Japanese)

### Virtual Currency (Optional)

**Learning Coins** (earned through achievements):
- 🪙 Spend coins on:
  - XP boosts (2x for 1 hour)
  - Streak freeze (protect streak if you miss a day)
  - Hint tokens (extra hints on difficult questions)
  - Avatar items
  - Cosmetic upgrades

**Earning Coins**:
- Daily login: 10 coins
- Unit completion: 50 coins
- Achievement unlocked: 25-500 coins (based on rarity)
- Leaderboard prizes: 1000+ coins

### Real-World Incentives (Instructor Tools)

**Instructor Rewards** (for top performers):
- Certificate generator for achievements
- Extra credit points
- Public recognition in class
- "Student of the Month" feature

**Printable Certificates**:
```jsx
<CertificateGenerator
  studentName={student.name}
  achievement={achievement}
  earnedDate={earnedDate}
  signature={instructor.signature}
  template="traditional-japanese"
/>
```

---

## Data Models

### GraphQL Schema Additions

```graphql
# User stats and progression
type UserProfile @model @auth(rules: [
  { allow: owner, ownerField: "userID" },
  { allow: public, operations: [read] }  # Public leaderboards
]) {
  id: ID!
  userID: String! @index(name: "byUser")
  username: String!
  displayName: String
  
  # Progression
  totalXP: Int! @default(value: "0")
  level: Int! @default(value: "1")
  title: String @default(value: "Beginner")
  
  # Streaks
  currentStreak: Int! @default(value: "0")
  longestStreak: Int! @default(value: "0")
  lastStudyDate: AWSDate
  
  # Stats
  unitsCompleted: Int! @default(value: "0")
  averageAccuracy: Float
  totalStudyTime: Int  # minutes
  questionsAnswered: Int! @default(value: "0")
  audioRecordings: Int! @default(value: "0")
  
  # Customization
  avatar: String
  avatarFrame: String
  theme: String
  
  # Timestamps
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  
  # Relationships
  achievements: [UserAchievement] @hasMany(indexName: "byUserProfile", fields: ["id"])
  badges: [UserBadge] @hasMany(indexName: "byUserProfile", fields: ["id"])
}

# Achievement definitions (system-wide)
type Achievement @model @auth(rules: [
  { allow: groups, groups: ["Admins"], operations: [create, update, delete] },
  { allow: public, operations: [read] }
]) {
  id: ID!
  name: String!
  description: String!
  category: String!  # "vocabulary", "streak", "accuracy", etc.
  icon: String!
  rarity: String!  # "common", "rare", "epic", "legendary"
  xpReward: Int!
  
  # Unlock criteria (JSON)
  criteria: AWSJSON!
  # Example: { "type": "unit_complete", "count": 10 }
  # Example: { "type": "streak", "days": 30 }
  # Example: { "type": "accuracy", "threshold": 90, "count": 25 }
  
  # Metadata
  isHidden: Boolean  # Easter egg achievements
  isLegacy: Boolean  # No longer obtainable
  seasonalEvent: String  # "halloween", "new-year", etc.
}

# User's earned achievements
type UserAchievement @model @auth(rules: [
  { allow: owner, ownerField: "userID" },
  { allow: public, operations: [read] }
]) {
  id: ID!
  userID: String!
  userProfileID: ID! @index(name: "byUserProfile")
  achievementID: ID! @index(name: "byAchievement")
  achievement: Achievement @belongsTo(fields: ["achievementID"])
  
  earnedAt: AWSDateTime!
  progress: Int  # For multi-step achievements
  isNotified: Boolean  # Has user seen the unlock animation?
}

# Badge definitions
type Badge @model @auth(rules: [
  { allow: groups, groups: ["Admins"], operations: [create, update, delete] },
  { allow: public, operations: [read] }
]) {
  id: ID!
  name: String!
  description: String!
  icon: String!  # SVG or image URL
  tier: String!  # "bronze", "silver", "gold", "platinum"
  category: String!
  
  # Achievement that grants this badge
  achievementID: ID
}

# User's earned badges
type UserBadge @model @auth(rules: [
  { allow: owner, ownerField: "userID" },
  { allow: public, operations: [read] }
]) {
  id: ID!
  userID: String!
  userProfileID: ID! @index(name: "byUserProfile")
  badgeID: ID! @index(name: "byBadge")
  badge: Badge @belongsTo(fields: ["badgeID"])
  
  earnedAt: AWSDateTime!
  isFeatured: Boolean  # Display on profile
}

# XP transactions (audit log)
type XPTransaction @model @auth(rules: [
  { allow: owner, ownerField: "userID" },
  { allow: groups, groups: ["Admins"], operations: [read] }
]) {
  id: ID!
  userID: String! @index(name: "byUser")
  amount: Int!
  source: String!  # "unit_complete", "question_correct", "achievement", etc.
  sourceID: String  # ID of unit, question, achievement, etc.
  multiplier: Float @default(value: "1.0")  # Streak or event bonus
  timestamp: AWSDateTime!
}

# Leaderboard entries (aggregated daily)
type LeaderboardEntry @model @auth(rules: [
  { allow: groups, groups: ["Admins"], operations: [create, update, delete] },
  { allow: public, operations: [read] }
]) {
  id: ID!
  userID: String! @index(name: "byUser")
  username: String!
  displayName: String
  avatar: String
  
  # Scores
  totalXP: Int!
  weeklyXP: Int!
  monthlyXP: Int!
  
  # Rankings
  globalRank: Int @index(name: "byGlobalRank", sortKeyFields: ["totalXP"])
  weeklyRank: Int
  monthlyRank: Int
  
  # Section-specific
  sectionID: ID @index(name: "bySection")
  sectionRank: Int
  
  # Metadata
  level: Int!
  title: String
  streak: Int!
  
  period: String!  # "weekly", "monthly", "all-time"
  periodStart: AWSDate!
  periodEnd: AWSDate!
  updatedAt: AWSDateTime!
}

# Learning duels (friend challenges)
type LearningDuel @model @auth(rules: [
  { allow: owner, ownerField: "challengerID" },
  { allow: owner, ownerField: "challengedID" }
]) {
  id: ID!
  challengerID: String!
  challengedID: String!
  
  unitID: ID!
  unit: Unit @belongsTo(fields: ["unitID"])
  
  status: String!  # "pending", "accepted", "declined", "completed"
  
  challengerScore: Int
  challengedScore: Int
  winnerID: String
  
  prize: String  # "100 XP", "Gold Badge", etc.
  
  createdAt: AWSDateTime!
  completedAt: AWSDateTime
}

# Daily study sessions
type StudySession @model @auth(rules: [
  { allow: owner, ownerField: "userID" }
]) {
  id: ID!
  userID: String! @index(name: "byUser")
  date: AWSDate! @index(name: "byDate")
  
  # Activity
  unitsCompleted: Int!
  questionsAnswered: Int!
  xpEarned: Int!
  studyTime: Int!  # minutes
  
  # Quality
  averageAccuracy: Float
  
  # Streak
  isStreakDay: Boolean!
  streakCount: Int!
}

# Virtual currency (optional)
type CoinWallet @model @auth(rules: [
  { allow: owner, ownerField: "userID" }
]) {
  id: ID!
  userID: String! @index(name: "byUser")
  balance: Int! @default(value: "0")
  
  # Transaction history
  transactions: [CoinTransaction] @hasMany(indexName: "byWallet", fields: ["id"])
}

type CoinTransaction @model @auth(rules: [
  { allow: owner, ownerField: "userID" }
]) {
  id: ID!
  userID: String!
  walletID: ID! @index(name: "byWallet")
  
  amount: Int!  # Positive = earned, negative = spent
  source: String!  # "achievement", "daily_login", "purchase", etc.
  description: String
  
  timestamp: AWSDateTime!
}
```

---

## UI Components

### Achievement Notification Toast

```jsx
// src/components/AchievementToast.js
import { Snackbar, Card, CardContent, Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';

export function AchievementToast({ achievement, open, onClose }) {
  const playSound = () => {
    const audio = new Audio('/sounds/achievement-unlock.mp3');
    audio.play();
  };
  
  useEffect(() => {
    if (open) playSound();
  }, [open]);
  
  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <Card sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          minWidth: 300,
        }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Box fontSize="3rem">{achievement.icon}</Box>
              <Box>
                <Typography variant="h6">Achievement Unlocked!</Typography>
                <Typography variant="h5">{achievement.name}</Typography>
                <Typography variant="body2">{achievement.description}</Typography>
                <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold' }}>
                  +{achievement.xpReward} XP
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Snackbar>
  );
}
```

### XP Progress Bar (Persistent UI)

```jsx
// Always visible at top of screen
<AppBar position="sticky">
  <Toolbar>
    <Avatar src={userProfile.avatar} />
    
    <Box sx={{ flexGrow: 1, mx: 2 }}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="body2">
          Level {userProfile.level} - {userProfile.title}
        </Typography>
        <Typography variant="body2">
          {currentXP} / {nextLevelXP} XP
        </Typography>
      </Box>
      
      <LinearProgress
        variant="determinate"
        value={(currentXP - levelXP) / (nextLevelXP - levelXP) * 100}
        sx={{
          height: 8,
          borderRadius: 5,
          background: 'rgba(255,255,255,0.2)',
          '& .MuiLinearProgress-bar': {
            background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
          }
        }}
      />
    </Box>
    
    <Tooltip title={`${userProfile.currentStreak} day streak`}>
      <Chip
        icon={<span>🔥</span>}
        label={userProfile.currentStreak}
        color="warning"
      />
    </Tooltip>
  </Toolbar>
</AppBar>
```

### Badge Collection Modal

```jsx
<Dialog open={open} maxWidth="lg" fullWidth>
  <DialogTitle>
    Your Achievements
    <Typography variant="body2">
      {earnedBadges.length} / {totalBadges} collected
    </Typography>
  </DialogTitle>
  
  <DialogContent>
    <Tabs value={selectedCategory} onChange={setSelectedCategory}>
      <Tab label="All" />
      <Tab label="Learning" />
      <Tab label="Streaks" />
      <Tab label="Social" />
      <Tab label="Special" />
    </Tabs>
    
    <Grid container spacing={2} sx={{ mt: 2 }}>
      {filteredBadges.map(badge => (
        <Grid item xs={6} sm={4} md={3} key={badge.id}>
          <BadgeCard
            badge={badge}
            earned={badge.isEarned}
            onClick={() => setSelectedBadge(badge)}
          >
            <BadgeIcon
              src={badge.icon}
              grayscale={!badge.isEarned}
              animated={badge.isEarned && badge.tier === 'platinum'}
            />
            <BadgeName>{badge.name}</BadgeName>
            
            {badge.isEarned ? (
              <EarnedDate>{formatDate(badge.earnedAt)}</EarnedDate>
            ) : (
              <ProgressIndicator>
                {badge.progress}/{badge.goal}
              </ProgressIndicator>
            )}
          </BadgeCard>
        </Grid>
      ))}
    </Grid>
  </DialogContent>
</Dialog>
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2, 40 hours)

**Tasks**:
1. Add UserProfile, Achievement, Badge models to schema
2. Run `amplify push`
3. Create XP calculation utilities
4. Build AchievementEngine service (checks triggers)
5. Basic AchievementToast component

**Deliverables**:
- ✅ Schema updated with gamification models
- ✅ XP tracking functional
- ✅ First 10 achievements defined
- ✅ Toast notification working

### Phase 2: Core Achievements (Week 3-4, 50 hours)

**Tasks**:
1. Implement achievement triggers in existing code:
   - QuizComponent → question_correct event
   - Unit completion → unit_complete event
   - Grade.save → accuracy_threshold event
2. Create 50+ achievement definitions
3. Build BadgeCollection UI
4. Persistent XP progress bar

**Deliverables**:
- ✅ 50 achievements working end-to-end
- ✅ Badge collection viewable
- ✅ XP bar always visible

### Phase 3: Streaks & Daily Goals (Week 5, 30 hours)

**Tasks**:
1. StudySession model and daily tracking
2. Streak calculation logic
3. Daily goal setting UI
4. Streak protection (coin shop)
5. Calendar heatmap visualization

**Deliverables**:
- ✅ Streak system functional
- ✅ Daily goals with reminders
- ✅ Streak freeze mechanic

### Phase 4: Leaderboards (Week 6-7, 40 hours)

**Tasks**:
1. LeaderboardEntry model + aggregation Lambda
2. Global, section, and friends leaderboards
3. Weekly/monthly resets
4. Rank change tracking (↑↓ indicators)
5. Leaderboard UI component

**Deliverables**:
- ✅ 3 leaderboard types working
- ✅ Real-time rank updates
- ✅ Weekly prizes automated

### Phase 5: Social & Duels (Week 8, 30 hours)

**Tasks**:
1. LearningDuel model
2. Friend system (add/remove friends)
3. Challenge friend UI
4. Activity feed
5. Duel results + prizes

**Deliverables**:
- ✅ Friend challenges working
- ✅ Activity feed showing achievements
- ✅ Duel mechanics complete

### Phase 6: Skill Trees & Visualization (Week 9-10, 50 hours)

**Tasks**:
1. Define skill tree structure (JSON config)
2. Interactive skill tree component (D3.js or React Flow)
3. Progress dashboard with charts
4. Radar chart for skill balance
5. Study stats page

**Deliverables**:
- ✅ Skill tree visualization
- ✅ Comprehensive stats dashboard
- ✅ Progress charts

### Phase 7: Rewards & Customization (Week 11, 30 hours)

**Tasks**:
1. Avatar customization system
2. CoinWallet model + shop UI
3. Unlockable themes
4. Reward redemption flow
5. Certificate generator

**Deliverables**:
- ✅ Avatar items unlockable
- ✅ Coin economy working
- ✅ Theme customization

### Phase 8: Polish & Balance (Week 12, 30 hours)

**Tasks**:
1. Achievement difficulty balancing
2. Animation polish (unlock moments)
3. Sound effects
4. Performance optimization
5. Testing and bug fixes

**Deliverables**:
- ✅ Smooth animations
- ✅ Balanced XP curve
- ✅ No performance issues

**Total Timeline**: 12 weeks  
**Total Effort**: ~300 hours

---

## Testing & Validation

### Test Cases

**Achievement Unlock Testing**:
```javascript
describe('Achievement System', () => {
  it('should unlock "First Words" after learning 5 words', async () => {
    const user = await createTestUser();
    
    // Learn 5 words
    for (let i = 0; i < 5; i++) {
      await learnWord(user, testWords[i]);
    }
    
    // Check achievement unlocked
    const achievements = await getUserAchievements(user.id);
    expect(achievements).toContainEqual(
      expect.objectContaining({ name: 'First Words' })
    );
    
    // Check XP awarded
    const profile = await getUserProfile(user.id);
    expect(profile.totalXP).toBeGreaterThanOrEqual(50);
  });
  
  it('should track streak correctly', async () => {
    const user = await createTestUser();
    
    // Simulate 7 days of study
    for (let i = 0; i < 7; i++) {
      const date = addDays(new Date(), -i);
      await recordStudySession(user, date);
    }
    
    const profile = await getUserProfile(user.id);
    expect(profile.currentStreak).toBe(7);
    expect(profile.achievements).toContainEqual(
      expect.objectContaining({ name: 'Getting Warmed Up' })
    );
  });
});
```

**XP Calculation Testing**:
```javascript
it('should apply streak multiplier correctly', () => {
  const baseXP = 10;
  const streak = 30;
  const multiplier = getStreakMultiplier(streak); // 1.25
  const finalXP = applyMultiplier(baseXP, multiplier);
  
  expect(finalXP).toBe(12.5); // 10 * 1.25
});

it('should calculate level correctly', () => {
  expect(calculateLevel(100)).toBe(1);
  expect(calculateLevel(400)).toBe(2);
  expect(calculateLevel(2500)).toBe(5);
  expect(calculateLevel(10000)).toBe(10);
});
```

### Analytics & Monitoring

**Track Engagement**:
- Achievement unlock rate (% of users earning each achievement)
- Average time to unlock
- Most/least popular achievements
- Streak survival rate (% reaching 7, 30, 100 days)
- Leaderboard participation
- Duel acceptance rate

**Balance Metrics**:
- XP inflation (average user level over time)
- Achievement difficulty (median time to unlock)
- Reward effectiveness (does unlocking boost engagement?)

---

## Future Enhancements

### Season Passes (Battle Pass Style)
- Quarterly seasons with exclusive rewards
- Free track + premium track
- Limited-time cosmetics
- Season-ending grand prizes

### Guild System
- Form study groups
- Guild leaderboards
- Cooperative challenges
- Guild perks and bonuses

### Achievement Trading
- Trade duplicate badges with friends
- Auction house for rare items
- Gift achievements to motivate struggling students

### AR/VR Integration
- 3D badge collection room
- Walk through skill tree in VR
- Avatar customization in 3D

### Machine Learning Personalization
- AI-recommended challenges based on learning style
- Personalized achievement suggestions
- Adaptive difficulty for optimal flow state

---

## Success Metrics

### Engagement Targets

**30 Days Post-Launch**:
- ✅ 60% of active users have 7+ day streak
- ✅ 80% have unlocked at least 5 achievements
- ✅ 40% have customized their avatar
- ✅ 25% have participated in a duel

**90 Days Post-Launch**:
- ✅ 30% of users reached Level 10+
- ✅ 15% have 30+ day streak
- ✅ 50% regularly check leaderboards
- ✅ Achievement unlock rate: 20+ per week across platform

**Retention Impact**:
- ✅ 7-day retention increase: +15% (from baseline)
- ✅ 30-day retention increase: +25%
- ✅ Average session length: +10 minutes
- ✅ Units completed per user: +30%

---

**Last Updated**: January 9, 2026  
**Document Owner**: Product & Development Team  
**Status**: Ready for Implementation 🚀
