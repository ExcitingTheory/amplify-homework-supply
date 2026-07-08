/**
 * Utility for submitting translation changes as a GitHub Pull Request.
 *
 * Uses the GitHub REST API (Contents API) directly from the browser.
 * Authentication via a Personal Access Token (fine-grained or classic) with
 * at minimum `contents:write` and `pull_requests:write` on this repo.
 */
import { TranslationExporter } from './TranslationExporter';

const GITHUB_API = 'https://api.github.com';

export const REPO_OWNER = 'ExcitingTheory';
export const REPO_NAME = 'amplify-homework-supply';
export const DEFAULT_BRANCH = 'main';

export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
}

export interface GitHubAccessInfo {
  login: string;
  avatarUrl: string;
  hasWriteAccess: boolean;
  defaultBranch: string;
}

export interface PRResult {
  url: string;
  number: number;
  branch: string;
}

/** Encode a UTF-8 string to base64 (browser-safe, handles non-ASCII). */
function encodeBase64(content: string): string {
  const bytes = new TextEncoder().encode(content);
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  return btoa(binary);
}

async function ghFetch(
  config: GitHubConfig,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  });
}

export class TranslationGitHubExporter {
  static readonly TOKEN_KEY = 'translation-mode/github-pat';

  static getStoredToken(): string {
    try { return localStorage.getItem(this.TOKEN_KEY) ?? ''; }
    catch { return ''; }
  }

  static storeToken(token: string): void {
    try { localStorage.setItem(this.TOKEN_KEY, token); }
    catch { /* ignore - no localStorage in some contexts */ }
  }

  static clearToken(): void {
    try { localStorage.removeItem(this.TOKEN_KEY); }
    catch { /* ignore */ }
  }

  /** Verify the token and check push access to the repo. */
  static async checkAccess(config: GitHubConfig): Promise<GitHubAccessInfo> {
    const [userRes, repoRes] = await Promise.all([
      ghFetch(config, '/user'),
      ghFetch(config, `/repos/${config.owner}/${config.repo}`),
    ]);

    if (userRes.status === 401) throw new Error('Invalid token — check the PAT and try again.');
    if (!userRes.ok) throw new Error(`GitHub API error (user): ${userRes.status}`);
    if (repoRes.status === 404) throw new Error('Repository not found or not accessible with this token.');
    if (!repoRes.ok) throw new Error(`GitHub API error (repo): ${repoRes.status}`);

    const user = await userRes.json();
    const repo = await repoRes.json();

    return {
      login: user.login as string,
      avatarUrl: user.avatar_url as string,
      hasWriteAccess: !!(repo.permissions?.push || repo.permissions?.admin),
      defaultBranch: (repo.default_branch as string) ?? DEFAULT_BRANCH,
    };
  }

  /**
   * Build the merged file map for all changed keys.
   * Returns { repoPath → JSON string } ready to commit.
   */
  static async buildChangedFiles(
    changedFullKeys: string[],
    editedValues: Record<string, Record<string, string>>,
    allTranslations: Map<string, { key: string; namespace: string }>,
    loadTranslationFn: (lang: string, namespace: string) => Promise<Record<string, any> | null>
  ): Promise<Map<string, string>> {
    const filesMap = new Map<string, Record<string, any>>();

    for (const fullKey of changedFullKeys) {
      const t = allTranslations.get(fullKey);
      if (!t) continue;
      const values = editedValues[fullKey];
      if (!values) continue;

      for (const [lang, value] of Object.entries(values)) {
        if (value == null) continue;
        const fileKey = `${t.namespace}\0${lang}`;
        if (!filesMap.has(fileKey)) {
          const original = (await loadTranslationFn(lang, t.namespace)) ?? {};
          filesMap.set(fileKey, JSON.parse(JSON.stringify(original)));
        }
        TranslationExporter.setNestedValue(filesMap.get(fileKey)!, t.key, value);
      }
    }

    const result = new Map<string, string>();
    for (const [fileKey, content] of filesMap) {
      const sep = fileKey.indexOf('\0');
      const namespace = fileKey.slice(0, sep);
      const lang = fileKey.slice(sep + 1);
      result.set(`public/locales/${lang}/${namespace}.json`, JSON.stringify(content, null, 2));
    }
    return result;
  }

  // ─── GitHub API helpers ────────────────────────────────────────────────────

  private static async getHeadSha(config: GitHubConfig, branch: string): Promise<string> {
    const res = await ghFetch(config, `/repos/${config.owner}/${config.repo}/git/ref/heads/${branch}`);
    if (!res.ok) throw new Error(`Cannot resolve branch ${branch}: ${res.status}`);
    const data = await res.json();
    return data.object.sha as string;
  }

  private static async createBranch(
    config: GitHubConfig,
    branchName: string,
    fromSha: string
  ): Promise<void> {
    const res = await ghFetch(config, `/repos/${config.owner}/${config.repo}/git/refs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: fromSha }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Cannot create branch "${branchName}": ${body.message ?? res.status}`);
    }
  }

  private static async getFileSha(
    config: GitHubConfig,
    path: string,
    branch: string
  ): Promise<string | null> {
    const res = await ghFetch(
      config,
      `/repos/${config.owner}/${config.repo}/contents/${path}?ref=${encodeURIComponent(branch)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.sha as string) ?? null;
  }

  private static async commitFile(
    config: GitHubConfig,
    path: string,
    content: string,
    branch: string,
    message: string
  ): Promise<void> {
    const existingSha = await this.getFileSha(config, path, branch);
    const body: Record<string, unknown> = {
      message,
      content: encodeBase64(content),
      branch,
    };
    if (existingSha) body.sha = existingSha;

    const res = await ghFetch(config, `/repos/${config.owner}/${config.repo}/contents/${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Cannot commit ${path}: ${err.message ?? res.status}`);
    }
  }

  // ─── Public PR workflow ────────────────────────────────────────────────────

  /**
   * Full workflow: create branch → commit files → open PR.
   * @param onProgress  Called with a human-readable step description.
   */
  static async submitAsPR(
    config: GitHubConfig,
    files: Map<string, string>,
    options: {
      branchName: string;
      title: string;
      body: string;
      defaultBranch: string;
    },
    onProgress?: (step: string) => void
  ): Promise<PRResult> {
    // 1. Resolve HEAD SHA
    onProgress?.(`Resolving ${options.defaultBranch} HEAD…`);
    const headSha = await this.getHeadSha(config, options.defaultBranch);

    // 2. Create branch
    onProgress?.(`Creating branch ${options.branchName}…`);
    await this.createBranch(config, options.branchName, headSha);

    // 3. Commit each file
    const paths = Array.from(files.keys());
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      const filename = path.split('/').pop()!;
      onProgress?.(`Committing ${filename} (${i + 1}/${paths.length})…`);
      await this.commitFile(
        config,
        path,
        files.get(path)!,
        options.branchName,
        `feat(i18n): update ${filename} translations`
      );
    }

    // 4. Open PR
    onProgress?.('Opening pull request…');
    const prRes = await ghFetch(config, `/repos/${config.owner}/${config.repo}/pulls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: options.title,
        body: options.body,
        head: options.branchName,
        base: options.defaultBranch,
      }),
    });
    if (!prRes.ok) {
      const err = await prRes.json().catch(() => ({}));
      throw new Error(`Cannot open PR: ${err.message ?? prRes.status}`);
    }
    const pr = await prRes.json();

    return {
      url: pr.html_url as string,
      number: pr.number as number,
      branch: options.branchName,
    };
  }

  /** Generate a timestamp-based branch name. */
  static generateBranchName(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}${pad(now.getMinutes())}`;
    return `translation/update-${date}-${time}`;
  }

  /** Build the PR body markdown from changed keys and file paths. */
  static buildPRBody(changedFullKeys: string[], filePaths: string[]): string {
    const keyList = changedFullKeys.map((k) => `- \`${k}\``).join('\n');
    const fileList = filePaths.map((p) => `- \`${p}\``).join('\n');
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return [
      '## Translation Updates',
      '',
      `Updated ${changedFullKeys.length} translation key${changedFullKeys.length !== 1 ? 's' : ''} on ${date}.`,
      '',
      '### Modified keys',
      keyList,
      '',
      '### Modified locale files',
      fileList,
      '',
      '---',
      '*Submitted via Storybook Translation Mode addon*',
    ].join('\n');
  }
}
