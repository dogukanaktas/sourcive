import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "./sidebar";

const mockPush = jest.fn();
const mockDeleteConversation = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/chat/conv-1"),
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/contexts/conversations-context", () => ({
  useConversationsContext: () => ({
    conversations: [
      { id: "conv-1", title: "First conversation", updated_at: new Date().toISOString() },
      { id: "conv-2", title: "Second conversation", updated_at: new Date(Date.now() - 86_400_000).toISOString() },
      { id: "conv-3", title: "Old chat", updated_at: new Date(Date.now() - 3 * 86_400_000).toISOString() },
    ],
    deleteConversation: mockDeleteConversation,
  }),
}));

beforeEach(() => {
  mockPush.mockClear();
  mockDeleteConversation.mockClear();
});

describe("Sidebar — rendering", () => {
  it("renders all conversation titles", () => {
    render(<Sidebar />);
    expect(screen.getByText("First conversation")).toBeInTheDocument();
    expect(screen.getByText("Second conversation")).toBeInTheDocument();
    expect(screen.getByText("Old chat")).toBeInTheDocument();
  });

  it("renders the New chat button", () => {
    render(<Sidebar />);
    expect(screen.getByRole("button", { name: /new chat/i })).toBeInTheDocument();
  });
});

describe("Sidebar — active state", () => {
  it("highlights the conversation matching the current pathname", () => {
    render(<Sidebar />);
    // The active item is the nearest ancestor div that has bg-accent in its className
    const titleEl = screen.getByText("First conversation");
    const activeItem = titleEl.closest("div[class*='bg-accent']");
    expect(activeItem).not.toBeNull();
  });
});

describe("Sidebar — date formatting", () => {
  it("shows Today for a conversation updated today", () => {
    render(<Sidebar />);
    const todayLabels = screen.getAllByText("Today");
    expect(todayLabels.length).toBeGreaterThan(0);
  });

  it("shows Yesterday for a conversation updated yesterday", () => {
    render(<Sidebar />);
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
  });

  it("shows relative days for older conversations", () => {
    render(<Sidebar />);
    expect(screen.getByText("3d ago")).toBeInTheDocument();
  });
});

describe("Sidebar — actions", () => {
  it("navigates to a new UUID when New chat is clicked", async () => {
    render(<Sidebar />);
    await userEvent.click(screen.getByRole("button", { name: /new chat/i }));
    expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/^\/chat\/.+/));
  });

  it("navigates to the conversation when its title is clicked", async () => {
    render(<Sidebar />);
    await userEvent.click(screen.getByText("Second conversation"));
    expect(mockPush).toHaveBeenCalledWith("/chat/conv-2");
  });

  it("calls deleteConversation with the correct id", async () => {
    render(<Sidebar />);
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await userEvent.click(deleteButtons[0]);
    expect(mockDeleteConversation).toHaveBeenCalledWith("conv-1");
  });
});
