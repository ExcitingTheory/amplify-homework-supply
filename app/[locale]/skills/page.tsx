import { getServerClient } from "@/utils/amplifyServerClient";
import MyAuth from "@/components/AmplifyAuthenticator";
import { GamificationProviderWrapper } from "@/context/gamificationProviderWrapper";
import { SkillTreeClient } from "./SkillTreeClient";

export default async function SkillsPage() {
  let initialSkills: any[] = [];

  try {
    const client = getServerClient();

    // Fetch skill definitions (admin-configured, rarely change)
    const { data: skills } = await client.models.Skill.list();

    initialSkills = (skills || [])
      .filter((s: any) => s != null)
      .map((skill: any) => {
        let prerequisites: string[] = [];
        if (skill.prerequisites) {
          try {
            const parsed =
              typeof skill.prerequisites === "string"
                ? JSON.parse(skill.prerequisites)
                : skill.prerequisites;
            if (Array.isArray(parsed)) prerequisites = parsed;
          } catch {
            // ignore malformed
          }
        }
        return {
          skillId: skill.id,
          title: skill.title,
          description: skill.description || undefined,
          xpReward: skill.xpReward ?? undefined,
          prerequisites,
          cohortId: skill.cohortId || undefined,
        };
      });
  } catch (err) {
    console.error("[Skills RSC] Data fetch error:", err);
  }

  return (
    <MyAuth>
      <GamificationProviderWrapper>
        <SkillTreeClient initialSkills={initialSkills} />
      </GamificationProviderWrapper>
    </MyAuth>
  );
}
