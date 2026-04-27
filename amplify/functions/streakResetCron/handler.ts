/**
 * Streak Reset Cron Handler
 *
 * Runs daily. Scans all StudentStreak records and resets currentStreak to 0
 * for any student whose lastActivityDate is before yesterday (UTC).
 */

import type { Handler } from 'aws-lambda'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'

const LIST_ALL_STREAKS = `query ListStudentStreaks($nextToken: String) {
  listStudentStreaks(limit: 100, nextToken: $nextToken) {
    items { id studentId currentStreak longestStreak lastActivityDate _version }
    nextToken
  }
}`

const UPDATE_STREAK = `mutation UpdateStudentStreak($input: UpdateStudentStreakInput!) {
  updateStudentStreak(input: $input) { id studentId currentStreak _version }
}`

let client: any = null

function getClient() {
  if (!client) {
    Amplify.configure(
      {
        API: {
          GraphQL: {
            endpoint: process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT!,
            region: process.env.AWS_REGION,
            defaultAuthMode: 'iam',
          },
        },
      },
      { ssr: false }
    )
    client = generateClient()
  }
  return client
}

export const handler: Handler = async () => {
  const gql = getClient()

  // Yesterday at start of day UTC
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  yesterday.setUTCHours(0, 0, 0, 0)
  const yesterdayISO = yesterday.toISOString().split('T')[0] // YYYY-MM-DD

  let nextToken: string | null = null
  let resetCount = 0

  do {
    const result: any = await gql.graphql({
      query: LIST_ALL_STREAKS,
      variables: { nextToken },
    })

    const items = result?.data?.listStudentStreaks?.items || []
    nextToken = result?.data?.listStudentStreaks?.nextToken || null

    for (const streak of items) {
      if (!streak || streak.currentStreak === 0) continue

      // Compare lastActivityDate (YYYY-MM-DD or ISO) to yesterday
      const lastDate = streak.lastActivityDate
        ? streak.lastActivityDate.split('T')[0]
        : null

      if (!lastDate || lastDate < yesterdayISO) {
        try {
          await gql.graphql({
            query: UPDATE_STREAK,
            variables: {
              input: {
                id: streak.id,
                currentStreak: 0,
                _version: streak._version,
              },
            },
          })
          resetCount++
        } catch (err: any) {
          console.error(
            `[streakResetCron] Failed to reset streak for ${streak.studentId}:`,
            err?.message || err
          )
        }
      }
    }
  } while (nextToken)

  console.log(`[streakResetCron] Reset ${resetCount} streaks`)
  return { statusCode: 200, body: JSON.stringify({ resetCount }) }
}
