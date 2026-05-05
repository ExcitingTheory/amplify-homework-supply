/**
 * InstructorGamificationPanel — Admin UI for managing gamification features:
 * - Skill tree editor (add/remove/reorder skills)
 * - Campaign editor (narrative setting, stakes, chapter text)
 * - Guild management (create/edit guilds, assign students)
 * - Easter egg CRUD (create/edit/delete triggers)
 * - Boss battle parameters
 *
 * Each section is a collapsible accordion panel.
 *
 * @module InstructorGamificationPanel
 */

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'
import Divider from '@mui/material/Divider'
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import GroupsIcon from '@mui/icons-material/Groups'
import SearchIcon from '@mui/icons-material/Search'
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi'

// ============================================================================
// Types
// ============================================================================

export interface SkillEntry {
  id: string
  title: string
  description?: string
  xpReward?: number
  prerequisites?: string[]
}

export interface CampaignEntry {
  id: string
  title: string
  setting?: string
  stakes?: string
}

export interface GuildEntry {
  id: string
  name: string
  memberCount: number
}

export interface EasterEggEntry {
  id: string
  type: 'CLICK' | 'KEYWORD' | 'TIME' | 'INTERACTION'
  message: string
  xpReward: number
  keyword?: string
}

export interface BossEntry {
  id: string
  title: string
  totalHP: number
  phaseCount: number
  active: boolean
}

export interface InstructorGamificationPanelProps {
  /** Existing sections (for guild creation) */
  sections?: Array<{ id: string; name: string }>
  /** Existing skills */
  skills?: SkillEntry[]
  /** Existing campaigns */
  campaigns?: CampaignEntry[]
  /** Existing guilds */
  guilds?: GuildEntry[]
  /** Existing easter eggs */
  easterEggs?: EasterEggEntry[]
  /** Existing boss battles */
  bossBattles?: BossEntry[]
  /** Callbacks for CRUD operations */
  onAddSkill?: (skill: Omit<SkillEntry, 'id'>) => void
  onDeleteSkill?: (skillId: string) => void
  onSaveCampaign?: (campaign: Omit<CampaignEntry, 'id'> & { id?: string }) => void
  onDeleteCampaign?: (campaignId: string) => void
  onCreateGuild?: (name: string, cohortId: string) => void
  onDeleteGuild?: (guildId: string) => void
  onAddEasterEgg?: (egg: Omit<EasterEggEntry, 'id'>) => void
  onDeleteEasterEgg?: (eggId: string) => void
  onAddBoss?: (boss: Omit<BossEntry, 'id'>) => void
  onDeleteBoss?: (bossId: string) => void
}

// ============================================================================
// Component
// ============================================================================

export function InstructorGamificationPanel({
  sections = [],
  skills = [],
  campaigns = [],
  guilds = [],
  easterEggs = [],
  bossBattles = [],
  onAddSkill,
  onDeleteSkill,
  onSaveCampaign,
  onDeleteCampaign,
  onCreateGuild,
  onDeleteGuild,
  onAddEasterEgg,
  onDeleteEasterEgg,
  onAddBoss,
  onDeleteBoss,
}: InstructorGamificationPanelProps) {
  // Local form state for inline creation
  const [newSkillTitle, setNewSkillTitle] = useState('')
  const [newGuildName, setNewGuildName] = useState('')
  const [selectedGuildSection, setSelectedGuildSection] = useState<{ id: string; name?: string; description?: string } | null>(null)
  const guildSectionFilter = React.useMemo(
    () => createFilterOptions<{ id: string; name?: string; description?: string }>({
      stringify: (option) => `${option.name || ''} ${option.description || ''}`,
    }),
    []
  )
  const [newEggMessage, setNewEggMessage] = useState('')
  const [newEggType, setNewEggType] = useState<EasterEggEntry['type']>('CLICK')
  const [newEggXP, setNewEggXP] = useState(50)
  const [campaignTitle, setCampaignTitle] = useState('')
  const [campaignSetting, setCampaignSetting] = useState('')
  const [campaignStakes, setCampaignStakes] = useState('')

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Gamification Admin
      </Typography>

      {/* ---- Skill Tree Editor ---- */}
      <Accordion defaultExpanded={false}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <AccountTreeIcon sx={{ mr: 1 }} />
          <Typography fontWeight={600}>Skill Tree ({skills.length} skills)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <TextField
              size="small"
              label="Skill title"
              value={newSkillTitle}
              onChange={(e) => setNewSkillTitle(e.target.value)}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              disabled={!newSkillTitle.trim()}
              onClick={() => {
                onAddSkill?.({ title: newSkillTitle.trim() })
                setNewSkillTitle('')
              }}
            >
              Add
            </Button>
          </Stack>
          <List dense>
            {skills.map((skill) => (
              <ListItem key={skill.id} divider>
                <ListItemText
                  primary={skill.title}
                  secondary={skill.description || `${skill.xpReward || 0} XP`}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" size="small" onClick={() => onDeleteSkill?.(skill.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {skills.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                No skills defined. Add your first skill above.
              </Typography>
            )}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* ---- Campaign Editor ---- */}
      <Accordion defaultExpanded={false}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <AutoStoriesIcon sx={{ mr: 1 }} />
          <Typography fontWeight={600}>Campaign ({campaigns.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2} sx={{ mb: 2 }}>
            <TextField
              size="small"
              label="Campaign title"
              value={campaignTitle}
              onChange={(e) => setCampaignTitle(e.target.value)}
              fullWidth
            />
            <TextField
              size="small"
              label="Setting"
              value={campaignSetting}
              onChange={(e) => setCampaignSetting(e.target.value)}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              size="small"
              label="Stakes"
              value={campaignStakes}
              onChange={(e) => setCampaignStakes(e.target.value)}
              multiline
              rows={2}
              fullWidth
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              disabled={!campaignTitle.trim()}
              onClick={() => {
                onSaveCampaign?.({
                  title: campaignTitle.trim(),
                  setting: campaignSetting.trim() || undefined,
                  stakes: campaignStakes.trim() || undefined,
                })
                setCampaignTitle('')
                setCampaignSetting('')
                setCampaignStakes('')
              }}
            >
              Save Campaign
            </Button>
          </Stack>
          <List dense>
            {campaigns.map((c) => (
              <ListItem key={c.id} divider>
                <ListItemText primary={c.title} secondary={c.setting?.slice(0, 60)} />
                <ListItemSecondaryAction>
                  <IconButton edge="end" size="small" onClick={() => onDeleteCampaign?.(c.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* ---- Guild Management ---- */}
      <Accordion defaultExpanded={false}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <GroupsIcon sx={{ mr: 1 }} />
          <Typography fontWeight={600}>Guilds ({guilds.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
            <Autocomplete
              options={sections}
              value={selectedGuildSection}
              onChange={(_, value) => setSelectedGuildSection(value)}
              filterOptions={guildSectionFilter}
              getOptionLabel={(option) => option.name || ''}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2">{option.name}</Typography>
                    {option.description && (
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField {...params} size="small" label="Section" />
              )}
              sx={{ minWidth: 200 }}
              size="small"
              noOptionsText="No sections found"
            />
            <TextField
              size="small"
              label="Guild name"
              value={newGuildName}
              onChange={(e) => setNewGuildName(e.target.value)}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              disabled={!newGuildName.trim() || !selectedGuildSection}
              onClick={() => {
                onCreateGuild?.(newGuildName.trim(), selectedGuildSection!.id)
                setNewGuildName('')
                setSelectedGuildSection(null)
              }}
            >
              Create
            </Button>
          </Stack>
          <List dense>
            {guilds.map((g) => (
              <ListItem key={g.id} divider>
                <ListItemText primary={g.name} secondary={`${g.memberCount} members`} />
                <ListItemSecondaryAction>
                  <IconButton edge="end" size="small" onClick={() => onDeleteGuild?.(g.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {guilds.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                No guilds yet.
              </Typography>
            )}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* ---- Easter Egg CRUD ---- */}
      <Accordion defaultExpanded={false}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <SearchIcon sx={{ mr: 1 }} />
          <Typography fontWeight={600}>Easter Eggs ({easterEggs.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newEggType}
                  label="Type"
                  onChange={(e) => setNewEggType(e.target.value as EasterEggEntry['type'])}
                >
                  <MenuItem value="CLICK">Click</MenuItem>
                  <MenuItem value="KEYWORD">Keyword</MenuItem>
                  <MenuItem value="TIME">Time</MenuItem>
                  <MenuItem value="INTERACTION">Interaction</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Message"
                value={newEggMessage}
                onChange={(e) => setNewEggMessage(e.target.value)}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="XP"
                type="number"
                value={newEggXP}
                onChange={(e) => setNewEggXP(Number(e.target.value))}
                sx={{ width: 80 }}
              />
            </Stack>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              disabled={!newEggMessage.trim()}
              onClick={() => {
                onAddEasterEgg?.({
                  type: newEggType,
                  message: newEggMessage.trim(),
                  xpReward: newEggXP,
                })
                setNewEggMessage('')
                setNewEggXP(50)
              }}
            >
              Add Easter Egg
            </Button>
          </Stack>
          <List dense>
            {easterEggs.map((egg) => (
              <ListItem key={egg.id} divider>
                <ListItemText
                  primary={egg.message}
                  secondary={
                    <Stack direction="row" spacing={0.5} component="span">
                      <Chip label={egg.type} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                      <Chip label={`${egg.xpReward} XP`} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                    </Stack>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" size="small" onClick={() => onDeleteEasterEgg?.(egg.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* ---- Boss Battle Parameters ---- */}
      <Accordion defaultExpanded={false}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <SportsKabaddiIcon sx={{ mr: 1 }} />
          <Typography fontWeight={600}>Boss Battles ({bossBattles.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {bossBattles.map((boss) => (
              <ListItem key={boss.id} divider>
                <ListItemText
                  primary={boss.title}
                  secondary={`HP: ${boss.totalHP.toLocaleString()} | ${boss.phaseCount} phases | ${boss.active ? 'Active' : 'Inactive'}`}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" size="small" onClick={() => onDeleteBoss?.(boss.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {bossBattles.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                No boss battles configured.
              </Typography>
            )}
          </List>
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}

export default InstructorGamificationPanel
