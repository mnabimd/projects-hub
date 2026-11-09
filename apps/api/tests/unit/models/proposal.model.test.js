const mongoose = require('mongoose');
const { Proposal, Faculty, Project, SystemConfig } = require('../../../src/models');
const { roles, roleRights } = require('../../../src/config/roles');

describe('Phase 1: Foundations & Schemas', () => {
  describe('Roles configuration', () => {
    test('should include all required roles without duplicates', () => {
      expect(roles).toEqual(['student', 'teacher', 'department_head', 'faculty_dean', 'admin', 'super_admin']);
    });

    test('should assign correct proposal rights to student', () => {
      const studentRights = roleRights.get('student');
      expect(studentRights).toContain('createProposal');
      expect(studentRights).toContain('manageOwnProposal');
      expect(studentRights).toContain('submitProposal');
      expect(studentRights).not.toContain('reviewProposal');
      expect(studentRights).not.toContain('getProposals');
    });

    test('should assign reviewProposal and getProposals to department_head and faculty_dean', () => {
      const deptHeadRights = roleRights.get('department_head');
      expect(deptHeadRights).toContain('getProposals');
      expect(deptHeadRights).toContain('reviewProposal');
      expect(deptHeadRights).toContain('manageDepartmentSettings');

      const deanRights = roleRights.get('faculty_dean');
      expect(deanRights).toContain('getProposals');
      expect(deanRights).toContain('reviewProposal');
      expect(deanRights).toContain('manageDepartmentSettings');
    });

    test('should assign reviewProposal to teacher', () => {
      const teacherRights = roleRights.get('teacher');
      expect(teacherRights).toContain('reviewProposal');
      expect(teacherRights).not.toContain('createProposal');
    });
  });

  describe('Proposal model validation', () => {
    let validProposal;

    beforeEach(() => {
      validProposal = {
        universityId: mongoose.Types.ObjectId(),
        facultyId: mongoose.Types.ObjectId(),
        departmentId: mongoose.Types.ObjectId(),
        leader: {
          userId: mongoose.Types.ObjectId(),
          kankorId: 'M27001234',
          fullName: 'Alice Student',
        },
        title: 'Autonomous Drone Navigation System',
        type: 'universal',
        submissionMode: 'pdf',
        pdfFileUrl: 'https://storage.example.com/proposals/monograph.pdf',
      };
    });

    test('should validate a complete and valid proposal', async () => {
      const doc = new Proposal(validProposal);
      await expect(doc.validate()).resolves.toBeUndefined();
      expect(doc.status).toBe('draft');
      expect(doc.versionNumber).toBe(1);
      expect(doc.isLocked).toBe(false);
      expect(doc.publicId).toMatch(/^prp_[a-zA-Z0-9_-]+/);
    });

    test('should fail validation if title is missing', async () => {
      delete validProposal.title;
      await expect(new Proposal(validProposal).validate()).rejects.toThrow();
    });

    test('should fail validation if submissionMode is invalid', async () => {
      validProposal.submissionMode = 'unsupported_mode';
      await expect(new Proposal(validProposal).validate()).rejects.toThrow();
    });

    test('should fail validation if leader info is incomplete', async () => {
      delete validProposal.leader.kankorId;
      await expect(new Proposal(validProposal).validate()).rejects.toThrow();
    });

    test('should support structuredContent sub-document', async () => {
      validProposal.submissionMode = 'structured';
      validProposal.structuredContent = {
        introduction: 'Intro text',
        problemStatement: 'Problem text',
        objectives: ['Obj 1', 'Obj 2'],
        preliminaryMethodology: 'Agile development',
      };
      const doc = new Proposal(validProposal);
      await expect(doc.validate()).resolves.toBeUndefined();
      expect(doc.structuredContent.objectives).toHaveLength(2);
    });

    test('should correctly validate review entries in reviews array', async () => {
      const doc = new Proposal(validProposal);
      doc.reviews.push({
        reviewerId: mongoose.Types.ObjectId(),
        action: 'request_revision',
        feedbackText: 'Please clarify system architecture.',
        versionAtReview: 1,
      });
      await expect(doc.validate()).resolves.toBeUndefined();
      expect(doc.reviews[0]._id).toBeDefined();
    });
  });

  describe('Faculty model department settings', () => {
    test('should default department proposal and project settings properly', async () => {
      const faculty = new Faculty({
        universityId: mongoose.Types.ObjectId(),
        name: 'Faculty of Computer Science',
        departments: [{ name: 'Software Engineering' }],
      });
      await expect(faculty.validate()).resolves.toBeUndefined();
      const dept = faculty.departments[0];
      expect(dept.settings.proposal.submissionMode).toBe('pdf');
      expect(dept.settings.proposal.maxTeamSize).toBe(4);
      expect(dept.settings.proposal.isSubmissionOpen).toBe(true);
      expect(dept.settings.project.maxSupervisorLoad).toBe(5);
    });

    test('should accept custom proposal settings for a department', async () => {
      const faculty = new Faculty({
        universityId: mongoose.Types.ObjectId(),
        name: 'Faculty of Engineering',
        departments: [
          {
            name: 'Mechanical Engineering',
            settings: {
              proposal: {
                submissionMode: 'structured',
                maxTeamSize: 6,
                isSubmissionOpen: false,
                submissionDeadline: new Date('2026-12-31'),
              },
            },
          },
        ],
      });
      await expect(faculty.validate()).resolves.toBeUndefined();
      const dept = faculty.departments[0];
      expect(dept.settings.proposal.submissionMode).toBe('structured');
      expect(dept.settings.proposal.maxTeamSize).toBe(6);
      expect(dept.settings.proposal.isSubmissionOpen).toBe(false);
    });
  });

  describe('Project model proposalId field', () => {
    test('should support proposalId reference in Project schema', async () => {
      const proposalId = mongoose.Types.ObjectId();
      const project = new Project({
        proposalId,
        title: 'Project Title',
      });
      expect(project.proposalId).toEqual(proposalId);
    });
  });

  describe('SystemConfig model proposalDefaults', () => {
    test('should have proposalDefaults with expected schema defaults', async () => {
      const configDoc = new SystemConfig();
      expect(configDoc.proposalDefaults.submissionMode).toBe('pdf');
      expect(configDoc.proposalDefaults.maxTeamSize).toBe(4);
      expect(Array.from(configDoc.proposalDefaults.allowedTypes)).toEqual(['universal', 'science']);
    });
  });
});
