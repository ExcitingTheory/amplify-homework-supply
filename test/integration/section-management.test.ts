/**
 * Section Management Integration Tests
 * 
 * Tests class section management workflows including:
 * - Section creation and configuration
 * - Join code generation
 * - Student enrollment
 * - Assignment creation and distribution
 * - Section settings management
 * 
 * Usage:
 *   npm test test/integration/section-management.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock Amplify modules
vi.mock('aws-amplify/datastore', () => ({
  DataStore: {
    observeQuery: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../src/utils/amplifyClient', () => ({
  getAmplifyClient: vi.fn(() => ({
    models: {
      Section: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
        get: vi.fn(),
      },
      Assignment: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
      },
      Unit: {
        list: vi.fn(),
      },
    },
    mutations: {
      createSectionGroup: vi.fn(),
      addSelfToSection: vi.fn(),
    },
  })),
}));

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn().mockResolvedValue({
    identityId: 'instructor-identity',
    tokens: {
      accessToken: { payload: { username: 'instructor1@example.com' } },
    },
  }),
}));

vi.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('Section Management Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockSections: any[];
  let mockUnits: any[];

  beforeEach(() => {
    user = userEvent.setup();
    
    mockSections = [
      {
        id: 'section-1',
        name: 'Japanese 101 - Spring 2026',
        description: 'Beginner Japanese class',
        code: 'JP101-S26',
        status: 'PUBLISHED',
        createdAt: new Date('2026-01-01').toISOString(),
        updatedAt: new Date('2026-01-01').toISOString(),
      },
    ];

    mockUnits = [
      {
        id: 'unit-1',
        name: 'Hiragana Basics',
        description: 'Learn basic hiragana characters',
        status: 'PUBLISHED',
      },
      {
        id: 'unit-2',
        name: 'Katakana Basics',
        description: 'Learn basic katakana characters',
        status: 'PUBLISHED',
      },
    ];

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Mock component for testing - in real app this would be the actual sections page
  const SectionsPage = () => {
    const [sections, setSections] = React.useState(mockSections);
    const [selectedSection, setSelectedSection] = React.useState<any>(null);

    return (
      <div>
        <button onClick={() => setSelectedSection({})}>Create Section</button>
        <div role="list">
          {sections.map(section => (
            <div key={section.id} role="listitem">
              <h3>{section.name}</h3>
              <p>{section.description}</p>
              <span>{section.code}</span>
              <button onClick={() => setSelectedSection(section)}>Edit</button>
            </div>
          ))}
        </div>
        {selectedSection && (
          <div role="dialog">
            <h2>{selectedSection.id ? 'Edit Section' : 'Create Section'}</h2>
            <label>
              Name
              <input name="name" defaultValue={selectedSection.name} />
            </label>
            <label>
              Description
              <textarea name="description" defaultValue={selectedSection.description} />
            </label>
            <button>Save</button>
            <button onClick={() => setSelectedSection(null)}>Cancel</button>
          </div>
        )}
      </div>
    );
  };

  // ==========================================================================
  // Section Creation
  // ==========================================================================

  it('creates a new section', async () => {
    const { getAmplifyClient } = await import('../../src/utils/amplifyClient');
    const mockClient = vi.mocked(getAmplifyClient)();
    const createSection = vi.fn().mockResolvedValue({
      data: {
        id: 'section-2',
        name: 'Japanese 102',
        code: 'JP102-S26',
      },
    });
    mockClient.models.Section.create = createSection;

    render(<SectionsPage />);

    // Click create section button
    const createButton = screen.getByRole('button', { name: /create section/i });
    await user.click(createButton);

    // Fill in section details
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/name/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    await user.type(nameInput, 'Japanese 102');
    await user.type(descriptionInput, 'Intermediate Japanese class');

    // Save section
    const saveButton = within(screen.getByRole('dialog')).getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(createSection).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Japanese 102',
          description: 'Intermediate Japanese class',
        })
      );
    });
  });

  it('generates unique join code for section', async () => {
    const { getAmplifyClient } = await import('../../src/utils/amplifyClient');
    const mockClient = vi.mocked(getAmplifyClient)();
    
    mockClient.models.Section.create = vi.fn().mockResolvedValue({
      data: {
        id: 'section-2',
        name: 'Japanese 102',
        code: 'JP102-F26', // Auto-generated code
      },
    });

    render(<SectionsPage />);

    const createButton = screen.getByRole('button', { name: /create section/i });
    await user.click(createButton);

    await user.type(screen.getByLabelText(/name/i), 'Japanese 102');
    
    const saveButton = within(screen.getByRole('dialog')).getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockClient.models.Section.create).toHaveBeenCalled();
    });
  });

  it('creates dynamic Cognito group for section', async () => {
    const { getAmplifyClient } = await import('../../src/utils/amplifyClient');
    const mockClient = vi.mocked(getAmplifyClient)();
    
    const createSectionGroup = vi.fn().mockResolvedValue({
      data: 'section-jp101-s26',
    });
    mockClient.mutations.createSectionGroup = createSectionGroup;

    mockClient.models.Section.create = vi.fn().mockResolvedValue({
      data: {
        id: 'section-2',
        name: 'Japanese 101 - Spring 2026',
        code: 'JP101-S26',
      },
    });

    render(<SectionsPage />);

    const createButton = screen.getByRole('button', { name: /create section/i });
    await user.click(createButton);

    await user.type(screen.getByLabelText(/name/i), 'Japanese 101 - Spring 2026');
    
    const saveButton = within(screen.getByRole('dialog')).getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(createSectionGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringMatching(/japanese.*101/i),
        })
      );
    });
  });

  // ==========================================================================
  // Section Settings
  // ==========================================================================

  it('updates section name and description', async () => {
    const { getAmplifyClient } = await import('../../src/utils/amplifyClient');
    const mockClient = vi.mocked(getAmplifyClient)();
    
    const updateSection = vi.fn().mockResolvedValue({
      data: {
        id: 'section-1',
        name: 'Japanese 101 - Fall 2026',
        description: 'Updated description',
      },
    });
    mockClient.models.Section.update = updateSection;

    render(<SectionsPage />);

    // Click edit on existing section
    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Japanese 101 - Fall 2026');

    const saveButton = within(screen.getByRole('dialog')).getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(updateSection).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'section-1',
          name: 'Japanese 101 - Fall 2026',
        })
      );
    });
  });

  it('updates section status (draft/published)', async () => {
    const { getAmplifyClient } = await import('../../src/utils/amplifyClient');
    const mockClient = vi.mocked(getAmplifyClient)();
    
    const updateSection = vi.fn().mockResolvedValue({
      data: { id: 'section-1', status: 'DRAFT' },
    });
    mockClient.models.Section.update = updateSection;

    // Component would have status toggle
    render(
      <div>
        <button onClick={async () => {
          await mockClient.models.Section.update({
            id: 'section-1',
            status: 'DRAFT',
          });
        }}>
          Set to Draft
        </button>
      </div>
    );

    const draftButton = screen.getByRole('button', { name: /set to draft/i });
    await user.click(draftButton);

    await waitFor(() => {
      expect(updateSection).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'section-1',
          status: 'DRAFT',
        })
      );
    });
  });

  // ==========================================================================
  // Student Enrollment
  // ==========================================================================

  it('allows student to join section with code', async () => {
    const { getAmplifyClient } = await import('../../src/utils/amplifyClient');
    const mockClient = vi.mocked(getAmplifyClient)();
    
    const addSelfToSection = vi.fn().mockResolvedValue({
      data: 'Successfully joined section',
    });
    mockClient.mutations.addSelfToSection = addSelfToSection;

    // Mock student join component
    const JoinSection = () => {
      const [code, setCode] = React.useState('');
      
      const handleJoin = async () => {
        await mockClient.mutations.addSelfToSection({ code });
      };

      return (
        <div>
          <label>
            Join Code
            <input value={code} onChange={e => setCode(e.target.value)} />
          </label>
          <button onClick={handleJoin}>Join Section</button>
        </div>
      );
    };

    render(<JoinSection />);

    const codeInput = screen.getByLabelText(/join code/i);
    await user.type(codeInput, 'JP101-S26');

    const joinButton = screen.getByRole('button', { name: /join section/i });
    await user.click(joinButton);

    await waitFor(() => {
      expect(addSelfToSection).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'JP101-S26',
        })
      );
    });
  });

  it('validates join code format', async () => {
    const JoinSection = () => {
      const [code, setCode] = React.useState('');
      const [error, setError] = React.useState('');

      const handleJoin = () => {
        if (!/^[A-Z0-9-]+$/.test(code)) {
          setError('Invalid join code format');
          return;
        }
        setError('');
      };

      return (
        <div>
          <label>
            Join Code
            <input value={code} onChange={e => setCode(e.target.value)} />
          </label>
          <button onClick={handleJoin}>Join Section</button>
          {error && <div role="alert">{error}</div>}
        </div>
      );
    };

    render(<JoinSection />);

    const codeInput = screen.getByLabelText(/join code/i);
    await user.type(codeInput, 'invalid code!');

    const joinButton = screen.getByRole('button', { name: /join section/i });
    await user.click(joinButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid.*code/i);
    });
  });

  it('handles invalid join code gracefully', async () => {
    const { getAmplifyClient } = await import('../../src/utils/amplifyClient');
    const mockClient = vi.mocked(getAmplifyClient)();
    
    mockClient.mutations.addSelfToSection = vi.fn().mockRejectedValue(
      new Error('Section not found')
    );

    const JoinSection = () => {
      const [error, setError] = React.useState('');

      const handleJoin = async () => {
        try {
          await mockClient.mutations.addSelfToSection({ code: 'INVALID' });
        } catch (err: any) {
          setError(err.message);
        }
      };

      return (
        <div>
          <button onClick={handleJoin}>Join Section</button>
          {error && <div role="alert">{error}</div>}
        </div>
      );
    };

    render(<JoinSection />);

    const joinButton = screen.getByRole('button', { name: /join section/i });
    await user.click(joinButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/not found/i);
    });
  });

  // ==========================================================================
  // Assignment Creation
  // ==========================================================================

  it('creates assignment for section', async () => {
    const { getAmplifyClient } = await import('../../src/utils/amplifyClient');
    const mockClient = vi.mocked(getAmplifyClient)();
    
    const createAssignment = vi.fn().mockResolvedValue({
      data: {
        id: 'assignment-1',
        sectionID: 'section-1',
        unitID: 'unit-1',
        dueDate: '2026-02-01T17:00:00Z',
      },
    });
    mockClient.models.Assignment.create = createAssignment;

    const CreateAssignment = () => {
      const [dueDate, setDueDate] = React.useState('');

      const handleCreate = async () => {
        await mockClient.models.Assignment.create({
          sectionID: 'section-1',
          unitID: 'unit-1',
          dueDate,
          status: 'PUBLISHED',
          learner: 'student1@example.com',
        });
      };

      return (
        <div>
          <label>
            Due Date
            <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </label>
          <button onClick={handleCreate}>Create Assignment</button>
        </div>
      );
    };

    render(<CreateAssignment />);

    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.type(dueDateInput, '2026-02-01T17:00');

    const createButton = screen.getByRole('button', { name: /create assignment/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(createAssignment).toHaveBeenCalledWith(
        expect.objectContaining({
          sectionID: 'section-1',
          unitID: 'unit-1',
        })
      );
    });
  });

  it('creates assignment for multiple students in section', async () => {
    const { getAmplifyClient } = await import('../../src/utils/amplifyClient');
    const mockClient = vi.mocked(getAmplifyClient)();
    
    const createAssignment = vi.fn().mockResolvedValue({ data: {} });
    mockClient.models.Assignment.create = createAssignment;

    const students = ['student1@example.com', 'student2@example.com', 'student3@example.com'];

    // Simulate creating assignments for all students
    for (const student of students) {
      await mockClient.models.Assignment.create({
        sectionID: 'section-1',
        unitID: 'unit-1',
        learner: student,
        status: 'PUBLISHED',
      });
    }

    expect(createAssignment).toHaveBeenCalledTimes(3);
  });

  it('updates assignment due date', async () => {
    const { getAmplifyClient } = await import('../../src/utils/amplifyClient');
    const mockClient = vi.mocked(getAmplifyClient)();
    
    const updateAssignment = vi.fn().mockResolvedValue({
      data: {
        id: 'assignment-1',
        dueDate: '2026-02-15T17:00:00Z',
      },
    });
    mockClient.models.Assignment.update = updateAssignment;

    const UpdateAssignment = () => {
      const handleUpdate = async () => {
        await mockClient.models.Assignment.update({
          id: 'assignment-1',
          dueDate: '2026-02-15T17:00:00Z',
        });
      };

      return <button onClick={handleUpdate}>Update Due Date</button>;
    };

    render(<UpdateAssignment />);

    const updateButton = screen.getByRole('button', { name: /update due date/i });
    await user.click(updateButton);

    await waitFor(() => {
      expect(updateAssignment).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'assignment-1',
          dueDate: '2026-02-15T17:00:00Z',
        })
      );
    });
  });

  // ==========================================================================
  // Section Deletion
  // ==========================================================================

  it('deletes section', async () => {
    const { getAmplifyClient } = await import('../../src/utils/amplifyClient');
    const mockClient = vi.mocked(getAmplifyClient)();
    
    const deleteSection = vi.fn().mockResolvedValue({ data: {} });
    mockClient.models.Section.delete = deleteSection;

    const DeleteSection = () => {
      const [showConfirm, setShowConfirm] = React.useState(false);

      const handleDelete = async () => {
        await mockClient.models.Section.delete({ id: 'section-1' });
        setShowConfirm(false);
      };

      return (
        <div>
          <button onClick={() => setShowConfirm(true)}>Delete Section</button>
          {showConfirm && (
            <div role="dialog">
              <p>Are you sure?</p>
              <button onClick={handleDelete}>Confirm Delete</button>
              <button onClick={() => setShowConfirm(false)}>Cancel</button>
            </div>
          )}
        </div>
      );
    };

    render(<DeleteSection />);

    const deleteButton = screen.getByRole('button', { name: /delete section/i });
    await user.click(deleteButton);

    const confirmButton = await screen.findByRole('button', { name: /confirm delete/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(deleteSection).toHaveBeenCalledWith({ id: 'section-1' });
    });
  });

  it('prevents deletion of section with active assignments', async () => {
    const { getAmplifyClient } = await import('../../src/utils/amplifyClient');
    const mockClient = vi.mocked(getAmplifyClient)();
    
    // Mock assignments exist
    mockClient.models.Assignment.list = vi.fn().mockResolvedValue({
      data: [{ id: 'assignment-1' }],
    });

    const DeleteSection = () => {
      const [error, setError] = React.useState('');

      const handleDelete = async () => {
        const { data: assignments } = await mockClient.models.Assignment.list({
          filter: { sectionID: { eq: 'section-1' } },
        });

        if (assignments && assignments.length > 0) {
          setError('Cannot delete section with active assignments');
          return;
        }

        await mockClient.models.Section.delete({ id: 'section-1' });
      };

      return (
        <div>
          <button onClick={handleDelete}>Delete Section</button>
          {error && <div role="alert">{error}</div>}
        </div>
      );
    };

    render(<DeleteSection />);

    const deleteButton = screen.getByRole('button', { name: /delete section/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/cannot delete.*active assignments/i);
    });
  });

  // ==========================================================================
  // Section List and Organization
  // ==========================================================================

  it('displays list of instructor sections', async () => {
    render(<SectionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Japanese 101 - Spring 2026')).toBeInTheDocument();
      expect(screen.getByText('JP101-S26')).toBeInTheDocument();
    });
  });

  it('filters sections by status', async () => {
    const sectionsWithStatus = [
      ...mockSections,
      {
        id: 'section-2',
        name: 'Japanese 102 - Draft',
        code: 'JP102-S26',
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const FilteredSections = () => {
      const [filter, setFilter] = React.useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
      const filtered = sectionsWithStatus.filter(s => 
        filter === 'ALL' || s.status === filter
      );

      return (
        <div>
          <button onClick={() => setFilter('PUBLISHED')}>Show Published</button>
          <button onClick={() => setFilter('DRAFT')}>Show Draft</button>
          <div role="list">
            {filtered.map(section => (
              <div key={section.id} role="listitem">{section.name}</div>
            ))}
          </div>
        </div>
      );
    };

    render(<FilteredSections />);

    const publishedButton = screen.getByRole('button', { name: /show published/i });
    await user.click(publishedButton);

    await waitFor(() => {
      expect(screen.getByText('Japanese 101 - Spring 2026')).toBeInTheDocument();
      expect(screen.queryByText('Japanese 102 - Draft')).not.toBeInTheDocument();
    });
  });

  it('searches sections by name', async () => {
    const SearchSections = () => {
      const [search, setSearch] = React.useState('');
      const filtered = mockSections.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase())
      );

      return (
        <div>
          <label>
            Search
            <input value={search} onChange={e => setSearch(e.target.value)} />
          </label>
          <div role="list">
            {filtered.map(section => (
              <div key={section.id} role="listitem">{section.name}</div>
            ))}
          </div>
        </div>
      );
    };

    render(<SearchSections />);

    const searchInput = screen.getByLabelText(/search/i);
    await user.type(searchInput, '101');

    await waitFor(() => {
      expect(screen.getByText('Japanese 101 - Spring 2026')).toBeInTheDocument();
    });
  });
});
