/// <reference types="jest" />
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AuthMemory from "../../../data/authMemory";

jest.mock("../../../data/authMemory", () => ({
  __esModule: true,
  default: {
    getUser: jest.fn(),
    getClientFullData: jest.fn(),
    getLawyerFullData: jest.fn(),
    setClientFullData: jest.fn(),
    setLawyerFullData: jest.fn(),
    clear: jest.fn(),
  },
}));

jest.mock("../../../hooks/meetingApi", () => ({
  __esModule: true,
  fetchMeetings: jest.fn().mockResolvedValue([]),
  createMeeting: jest.fn(),
  fetchMeetingCases: jest.fn().mockResolvedValue([]),
}));

jest.mock("../../../hooks/clientApi", () => ({
  __esModule: true,
  fetchClientFullData: jest.fn(),
}));

jest.mock("../../../hooks/lawyerApi", () => ({
  __esModule: true,
  fetchLawyerFullData: jest.fn(),
}));

const MeetingScheduler = require("./MeetingScheduler").default as React.ComponentType<{ role: "admin" | "client" | "lawyer" }>;

const mockedAuthMemory = AuthMemory as jest.Mocked<typeof AuthMemory>;

describe("MeetingScheduler role-based scheduling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAuthMemory.getUser.mockReturnValue({
      id: 1,
      firmID: "F001",
      name: "Test User",
      role: "lawyer",
      status: "Active",
    });
  });

  it("shows only the linked client-case option for a lawyer", async () => {
    const { fetchLawyerFullData } = await import("../../../hooks/lawyerApi");

    (fetchLawyerFullData as jest.Mock).mockResolvedValue({
      lawyer: {
        id: 1,
        firmID: "F001",
        name: "Test Lawyer",
        email: "lawyer@example.com",
        username: "lawyer1",
        age: 30,
        ICNumber: "900101-01-1234",
        phoneNumber: "0123456789",
        HomeAddress: "Address",
        gender: "Male",
        maritalStatus: "Single",
        status: "Active",
        created_at: new Date().toISOString(),
      },
      cases: [
        {
          caseId: 101,
          title: "Family Case",
          caseName: "Family Case",
          clientName: "Client One",
          lawyerName: "Test Lawyer",
          description: "desc",
          status: "Active",
          created_at: new Date().toISOString(),
          blob_folder_path: "cases/101/",
          lawyerFirmID: "F001",
          clientFirmID: "C001",
          clientId: 11,
          lawyerId: 1,
        },
      ],
    });

    render(<MeetingScheduler role="lawyer" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Client Name/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Client One - Case #101/i)).toBeInTheDocument();
    expect(screen.queryByText(/auto-invites assigned lawyer/i)).not.toBeInTheDocument();
  });

  it("shows only the linked lawyer-case option for a client", async () => {
    mockedAuthMemory.getUser.mockReturnValue({
      id: 2,
      firmID: "C001",
      name: "Test Client",
      role: "client",
      status: "Active",
    });

    const { fetchClientFullData } = await import("../../../hooks/clientApi");

    (fetchClientFullData as jest.Mock).mockResolvedValue({
      client: {
        id: 2,
        firmID: "C001",
        name: "Test Client",
        email: "client@example.com",
        username: "client1",
        age: 29,
        ICNumber: "910101-01-1234",
        phoneNumber: "0123456789",
        HomeAddress: "Address",
        gender: "Female",
        maritalStatus: "Single",
        status: "Active",
        created_at: new Date().toISOString(),
      },
      cases: [
        {
          caseId: 202,
          title: "Divorce Case",
          caseName: "Divorce Case",
          clientName: "Test Client",
          lawyerName: "Lawyer Alpha",
          description: "desc",
          status: "Active",
          created_at: new Date().toISOString(),
          blob_folder_path: "cases/202/",
          lawyerFirmID: "L001",
          clientFirmID: "C001",
          clientId: 2,
          lawyerId: 20,
        },
      ],
    });

    render(<MeetingScheduler role="client" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Lawyer Name/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Lawyer Alpha - Case #202/i)).toBeInTheDocument();
    expect(screen.queryByText(/auto-invites assigned lawyer/i)).not.toBeInTheDocument();
  });

  it("shows the admin case scheduling prompt", async () => {
    mockedAuthMemory.getUser.mockReturnValue({
      id: 99,
      firmID: "A001",
      name: "Admin User",
      role: "admin",
      status: "Active",
    });

    const { fetchMeetingCases } = await import("../../../hooks/meetingApi");

    (fetchMeetingCases as jest.Mock).mockResolvedValue([
      {
        caseId: 303,
        title: "Commercial Dispute",
        clientName: "Client B",
        lawyerName: "Lawyer Beta",
      },
    ]);

    render(<MeetingScheduler role="admin" />);

    await waitFor(() => {
      expect(screen.getByText(/Admin scheduling uses the selected case/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Client Case/i)).toBeInTheDocument();
    expect(screen.getByText(/Client B -> Lawyer Beta - Case #303/i)).toBeInTheDocument();
  });

  it("submits an admin meeting for the selected case", async () => {
    mockedAuthMemory.getUser.mockReturnValue({
      id: 99,
      firmID: "A001",
      name: "Admin User",
      role: "admin",
      status: "Active",
    });

    const { fetchMeetingCases, createMeeting } = await import("../../../hooks/meetingApi");

    (fetchMeetingCases as jest.Mock).mockResolvedValue([
      {
        caseId: 303,
        title: "Commercial Dispute",
        clientName: "Client B",
        lawyerName: "Lawyer Beta",
      },
    ]);

    (createMeeting as jest.Mock).mockResolvedValue({
      id: 1,
      case_id: 303,
      case_title: "Commercial Dispute",
      meeting_method: "Online",
      agenda: "Discuss settlement",
      timezone: "Asia/Kuala_Lumpur",
      start_at: new Date().toISOString(),
      end_at: new Date().toISOString(),
      participants: {
        lawyer: { id: 20, name: "Lawyer Beta" },
        client: { id: 11, name: "Client B" },
      },
      organizer: { id: 99, name: "Admin User" },
    });

    render(<MeetingScheduler role="admin" />);

    await waitFor(() => {
      expect(screen.getByText(/Admin scheduling uses the selected case/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Client Case/i), { target: { value: "303:Client B" } });
    fireEvent.change(screen.getByLabelText(/^Date$/i), { target: { value: "2026-04-20" } });
    fireEvent.change(screen.getByLabelText(/Time Slot/i), { target: { value: "09:00" } });
    fireEvent.change(screen.getByLabelText(/Meeting Method/i), { target: { value: "Online" } });
    fireEvent.change(screen.getByLabelText(/Agenda/i), { target: { value: "Discuss settlement" } });

    expect(screen.getByRole("button", { name: /Schedule Meeting/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Schedule Meeting/i }));

    await waitFor(() => {
      expect(createMeeting).toHaveBeenCalledWith(
        expect.objectContaining({
          case_id: 303,
          meeting_method: "Online",
          agenda: "Discuss settlement",
          timezone: expect.any(String),
          start_at: expect.any(String),
          end_at: expect.any(String),
        })
      );
    });
  });

  it("blocks admin submission when no case is selected", async () => {
    mockedAuthMemory.getUser.mockReturnValue({
      id: 99,
      firmID: "A001",
      name: "Admin User",
      role: "admin",
      status: "Active",
    });

    const { fetchMeetingCases, createMeeting } = await import("../../../hooks/meetingApi");

    (fetchMeetingCases as jest.Mock).mockResolvedValue([
      {
        caseId: 303,
        title: "Commercial Dispute",
        clientName: "Client B",
        lawyerName: "Lawyer Beta",
      },
    ]);

    render(<MeetingScheduler role="admin" />);

    await waitFor(() => {
      expect(screen.getByText(/Admin scheduling uses the selected case/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/^Date$/i), { target: { value: "2026-04-20" } });
    fireEvent.change(screen.getByLabelText(/Time Slot/i), { target: { value: "09:00" } });
    fireEvent.change(screen.getByLabelText(/Agenda/i), { target: { value: "Discuss settlement" } });

    fireEvent.click(screen.getByRole("button", { name: /Schedule Meeting/i }));

    await waitFor(() => {
      expect(screen.getByText(/Please complete all required fields/i)).toBeInTheDocument();
    });

    expect(createMeeting).not.toHaveBeenCalled();
  });
});