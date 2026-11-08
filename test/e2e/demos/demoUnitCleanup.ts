import type { APIRequestContext } from "@playwright/test";

export interface CreatedDemoUnit {
  id: string;
  graphqlUrl: string;
  authorization: string;
}

export async function recycleFailedDemoUnit(
  request: Pick<APIRequestContext, "post">,
  unit: CreatedDemoUnit,
): Promise<void> {
  const response = await request.post(unit.graphqlUrl, {
    timeout: 90_000,
    headers: { authorization: unit.authorization },
    data: {
      query: `mutation RecycleFailedDemoUnit($modelName: String!, $id: ID!) {
        softDelete(modelName: $modelName, id: $id)
      }`,
      variables: { modelName: "Unit", id: unit.id },
    },
  });
  if (!response.ok()) {
    throw new Error(
      `Failed to recycle demo unit ${unit.id}: HTTP ${response.status()}`,
    );
  }
  const { data, errors } = await response.json();
  if (errors?.length) {
    if (errors.every((error: { message: string }) => error.message === "Execution timed out.")) {
      const verification = await request.post(unit.graphqlUrl, {
        timeout: 90_000,
        headers: { authorization: unit.authorization },
        data: {
          query: `query VerifyFailedDemoUnit($id: ID!) { getUnit(id: $id) { id deletedAt } }`,
          variables: { id: unit.id },
        },
      });
      if (verification.ok()) {
        const result = await verification.json();
        if (!result.errors?.length && result.data?.getUnit?.id === unit.id && result.data.getUnit.deletedAt) {
          console.warn(`Recycle request timed out; verified deletedAt for demo unit ${unit.id}`);
          return;
        }
      }
    }
    throw new Error(
      `Failed to recycle demo unit ${unit.id}: ${errors.map((error: { message: string }) => error.message).join("; ")}`,
    );
  }
  const result =
    typeof data?.softDelete === "string"
      ? JSON.parse(data.softDelete)
      : data?.softDelete;
  if (!result?.success) {
    throw new Error(
      `Failed to recycle demo unit ${unit.id}: ${result?.message || "No success response"}`,
    );
  }
}
