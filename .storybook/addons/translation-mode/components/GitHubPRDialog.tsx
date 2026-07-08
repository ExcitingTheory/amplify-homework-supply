import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Link,
  Divider,
  Avatar,
  Chip,
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LockIcon from '@mui/icons-material/Lock';
import {
  TranslationGitHubExporter,
  GitHubAccessInfo,
  PRResult,
  REPO_OWNER,
  REPO_NAME,
} from '../utils/TranslationGitHubExporter';

type DialogStep =
  | 'token-entry'
  | 'checking'
  | 'access-denied'
  | 'ready'
  | 'building'
  | 'submitting'
  | 'success'
  | 'error';

export interface GitHubPRDialogProps {
  open: boolean;
  onClose: () => void;
  /** Number of changed keys (for display). */
  changedKeyCount: number;
  /** Changed full keys (namespace:key) for PR body generation. */
  changedFullKeys: string[];
  /** Async callback that builds the files to commit. Called on submit. */
  buildFiles: () => Promise<Map<string, string>>;
}

export const GitHubPRDialog: React.FC<GitHubPRDialogProps> = ({
  open,
  onClose,
  changedKeyCount,
  changedFullKeys,
  buildFiles,
}) => {
  const [step, setStep] = useState<DialogStep>('token-entry');
  const [token, setToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [accessInfo, setAccessInfo] = useState<GitHubAccessInfo | null>(null);
  const [branchName, setBranchName] = useState('');
  const [prTitle, setPrTitle] = useState('');
  const [prBody, setPrBody] = useState('');
  const [progressText, setProgressText] = useState('');
  const [result, setResult] = useState<PRResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // On open: check for stored token
  useEffect(() => {
    if (!open) return;
    const stored = TranslationGitHubExporter.getStoredToken();
    if (stored) {
      setToken(stored);
      setTokenInput(stored);
      verifyToken(stored);
    } else {
      setStep('token-entry');
      setTokenInput('');
    }
    // Pre-fill branch / title when dialog opens
    setBranchName(TranslationGitHubExporter.generateBranchName());
    const count = changedKeyCount;
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setPrTitle(`chore(i18n): update translations (${count} key${count !== 1 ? 's' : ''}, ${date})`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const verifyToken = useCallback(async (t: string) => {
    setStep('checking');
    setErrorMsg('');
    try {
      const info = await TranslationGitHubExporter.checkAccess({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        token: t,
      });
      setAccessInfo(info);
      if (!info.hasWriteAccess) {
        setStep('access-denied');
        return;
      }
      TranslationGitHubExporter.storeToken(t);
      setToken(t);
      setStep('ready');
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStep('token-entry');
    }
  }, []);

  // Update PR body whenever we know the file paths (after step goes to 'ready')
  useEffect(() => {
    if (step !== 'ready') return;
    // We don't have exact file paths until build time, so show a placeholder
    const body = TranslationGitHubExporter.buildPRBody(changedFullKeys, [
      '(file paths resolved on submit)',
    ]);
    setPrBody(body);
  }, [step, changedFullKeys]);

  const handleSubmit = async () => {
    setStep('building');
    setProgressText('Building changed locale files…');
    try {
      const files = await buildFiles();

      // Rebuild PR body now that we know exact file paths
      const finalBody = TranslationGitHubExporter.buildPRBody(
        changedFullKeys,
        Array.from(files.keys())
      );

      setStep('submitting');
      const pr = await TranslationGitHubExporter.submitAsPR(
        { owner: REPO_OWNER, repo: REPO_NAME, token },
        files,
        {
          branchName,
          title: prTitle,
          body: finalBody,
          defaultBranch: accessInfo?.defaultBranch ?? 'main',
        },
        (text) => setProgressText(text)
      );
      setResult(pr);
      setStep('success');
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStep('error');
    }
  };

  const handleClose = () => {
    if (step === 'submitting' || step === 'building') return; // block close during submission
    onClose();
    // Reset transient state after close animation
    setTimeout(() => {
      setStep(TranslationGitHubExporter.getStoredToken() ? 'checking' : 'token-entry');
      setErrorMsg('');
      setResult(null);
      setProgressText('');
    }, 300);
  };

  const handleForgetToken = () => {
    TranslationGitHubExporter.clearToken();
    setToken('');
    setTokenInput('');
    setAccessInfo(null);
    setStep('token-entry');
  };

  const isSubmitting = step === 'building' || step === 'submitting';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isSubmitting}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <GitHubIcon fontSize="small" />
        Submit translations as Pull Request
      </DialogTitle>

      <DialogContent dividers>
        {/* ── Token entry ─────────────────────────────── */}
        {(step === 'token-entry' || step === 'checking') && (
          <Box>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Enter a GitHub Personal Access Token with <strong>Contents</strong> and{' '}
              <strong>Pull Requests</strong> write access on{' '}
              <Link
                href={`https://github.com/${REPO_OWNER}/${REPO_NAME}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {REPO_OWNER}/{REPO_NAME}
              </Link>
              .
            </Typography>

            <Alert severity="info" icon={<LockIcon fontSize="small" />} sx={{ mb: 2, fontSize: '0.8rem' }}>
              The token is stored only in your browser&apos;s localStorage and never sent to any
              server. Use a fine-grained PAT scoped to this repo only.{' '}
              <Link
                href="https://github.com/settings/personal-access-tokens/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                Create one on GitHub →
              </Link>
            </Alert>

            {errorMsg && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMsg}
              </Alert>
            )}

            <TextField
              label="GitHub Personal Access Token"
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              fullWidth
              size="small"
              placeholder="github_pat_… or ghp_…"
              disabled={step === 'checking'}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tokenInput.trim()) verifyToken(tokenInput.trim());
              }}
              InputProps={{
                endAdornment: step === 'checking' ? (
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                ) : undefined,
              }}
            />
          </Box>
        )}

        {/* ── Access denied ───────────────────────────── */}
        {step === 'access-denied' && accessInfo && (
          <Box>
            <Alert severity="error" sx={{ mb: 2 }}>
              <strong>@{accessInfo.login}</strong> does not have push (write) access to{' '}
              {REPO_OWNER}/{REPO_NAME}. Ask a repo admin to add you as a collaborator, or use a
              token that belongs to an account with write access.
            </Alert>
            <Button size="small" onClick={handleForgetToken}>
              Use a different token
            </Button>
          </Box>
        )}

        {/* ── Ready to submit ─────────────────────────── */}
        {step === 'ready' && accessInfo && (
          <Box>
            {/* User chip */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Avatar src={accessInfo.avatarUrl} sx={{ width: 24, height: 24 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Submitting as <strong>@{accessInfo.login}</strong>
              </Typography>
              <Chip
                label="Push access ✓"
                size="small"
                color="success"
                variant="outlined"
                sx={{ ml: 'auto', height: 20, fontSize: '0.65rem' }}
              />
              <Link
                component="button"
                variant="caption"
                onClick={handleForgetToken}
                sx={{ color: 'text.secondary', cursor: 'pointer' }}
              >
                Change
              </Link>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>
              {changedKeyCount} key{changedKeyCount !== 1 ? 's' : ''} will be committed to a new
              branch on <strong>{REPO_OWNER}/{REPO_NAME}</strong>.
            </Typography>

            <TextField
              label="Branch name"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 2, mt: 1 }}
              inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.85rem' } }}
            />

            <TextField
              label="PR title"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            />

            <TextField
              label="PR description"
              value={prBody}
              onChange={(e) => setPrBody(e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={6}
              inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.75rem' } }}
            />
          </Box>
        )}

        {/* ── In progress ─────────────────────────────── */}
        {isSubmitting && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3, gap: 2 }}>
            <CircularProgress size={36} />
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              {progressText}
            </Typography>
          </Box>
        )}

        {/* ── Success ─────────────────────────────────── */}
        {step === 'success' && result && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, gap: 2 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 48 }} />
            <Typography variant="h6" sx={{ color: 'text.primary' }}>
              PR #{result.number} created!
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              Branch <code style={{ fontFamily: 'monospace' }}>{result.branch}</code> was pushed
              and a pull request opened on GitHub.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<OpenInNewIcon />}
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              component="a"
            >
              Open PR #{result.number} on GitHub
            </Button>
          </Box>
        )}

        {/* ── Error ───────────────────────────────────── */}
        {step === 'error' && (
          <Box>
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMsg}
            </Alert>
            <Button size="small" onClick={() => setStep('ready')}>
              ← Go back and try again
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {step === 'token-entry' && (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => verifyToken(tokenInput.trim())}
              disabled={!tokenInput.trim() || step === 'checking'}
              startIcon={<GitHubIcon />}
            >
              Verify access
            </Button>
          </>
        )}

        {step === 'checking' && (
          <Button disabled startIcon={<CircularProgress size={14} />}>
            Checking…
          </Button>
        )}

        {step === 'access-denied' && (
          <Button onClick={handleClose}>Close</Button>
        )}

        {step === 'ready' && (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={!branchName.trim() || !prTitle.trim()}
              startIcon={<GitHubIcon />}
            >
              Create PR
            </Button>
          </>
        )}

        {isSubmitting && (
          <Button disabled>Submitting…</Button>
        )}

        {(step === 'success' || step === 'error') && (
          <Button onClick={handleClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
