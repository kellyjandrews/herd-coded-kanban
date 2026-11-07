import { expect, test } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Product board" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Backlog" })).toBeVisible();
});

test("closes the issue dialog with Escape and restores focus", async ({ page }) => {
  await page.goto("/");
  const newIssueButton = page.getByRole("button", { name: "New issue" });
  await newIssueButton.click();

  const dialog = page.getByRole("dialog", { name: "Create an issue" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(dialog).not.toBeVisible();
  await expect(newIssueButton).toBeFocused();
});

test("creates an issue, moves it between columns, and keeps it after reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New issue" }).click();
  await page.getByLabel("Title").fill("Ship the first release");
  await page.getByLabel("Description (optional)").fill("Prepare the launch checklist.");
  await page.getByRole("button", { name: "Create issue" }).click();

  const issue = page.getByRole("article", { name: "Issue: Ship the first release" });
  await expect(issue).toBeVisible();
  await issue.getByLabel("Move Ship the first release").selectOption("in-progress");
  await expect(page.getByRole("region", { name: "In progress" }).getByRole("article")).toHaveCount(
    2,
  );
  await expect(issue).toContainText("Prepare the launch checklist.");

  await page.reload();
  await expect(
    page.getByRole("region", { name: "In progress" }).getByRole("article", {
      name: "Issue: Ship the first release",
    }),
  ).toBeVisible();
});

test("moves an issue by dragging it to another column", async ({ page }) => {
  await page.goto("/");
  const issue = page.getByRole("article", { name: "Issue: Set up the project workspace" });
  const doneColumn = page.getByRole("region", { name: "Done" });

  await issue.dragTo(doneColumn);

  await expect(
    doneColumn.getByRole("article", { name: "Issue: Set up the project workspace" }),
  ).toBeVisible();
});

test("health endpoint is ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toMatchObject({ status: "ok" });
});
