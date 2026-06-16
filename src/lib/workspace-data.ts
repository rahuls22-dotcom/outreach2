// Multi-workspace model. Three regional teams under Guyju's; the
// head of marketing has access to all, individual contributors only see one.

export type Workspace = {
  id: string;
  name: string;
  region: string;
  memberCount: number;
};

export const WORKSPACES: Workspace[] = [
  {
    id: "ws-south",
    name: "Guyju's South",
    region: "Bangalore · Chennai · Hyderabad",
    memberCount: 8,
  },
  {
    id: "ws-ncr",
    name: "Guyju's North",
    region: "Delhi · Gurugram · Kota",
    memberCount: 5,
  },
  {
    id: "ws-mmr",
    name: "Guyju's West",
    region: "Mumbai · Pune",
    memberCount: 9,
  },
];

export function getWorkspace(id: string): Workspace | undefined {
  return WORKSPACES.find((w) => w.id === id);
}

// ─── Users / roles ──────────────────────────────────────────────────────

export type UserRole = "admin" | "member";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  // workspaceIds the user can switch into. Admins always have all.
  workspaceIds: string[];
  // For members, this is their default + only workspace.
  defaultWorkspaceId: string;
};

export const USERS: AppUser[] = [
  {
    id: "u-head-marketing",
    name: "Ankit Purohit",
    email: "ankit.purohit@guyjus.com",
    role: "admin",
    workspaceIds: WORKSPACES.map((w) => w.id),
    defaultWorkspaceId: "ws-south",
  },
  {
    id: "u-south-lead",
    name: "Arjun Rao",
    email: "arjun.rao@guyjus.com",
    role: "member",
    workspaceIds: ["ws-south"],
    defaultWorkspaceId: "ws-south",
  },
  {
    id: "u-ncr-lead",
    name: "Neha Kapoor",
    email: "neha.kapoor@guyjus.com",
    role: "member",
    workspaceIds: ["ws-ncr"],
    defaultWorkspaceId: "ws-ncr",
  },
  {
    id: "u-mmr-lead",
    name: "Karthik Iyer",
    email: "karthik.iyer@guyjus.com",
    role: "member",
    workspaceIds: ["ws-mmr"],
    defaultWorkspaceId: "ws-mmr",
  },
];

export function getUser(id: string): AppUser | undefined {
  return USERS.find((u) => u.id === id);
}

// ─── Workspace members ────────────────────────────────────────────────────
//
// A membership is per-workspace: the same person can be an admin in one
// workspace and a member in another. This `role` is the workspace role the
// Settings → Workspaces panel edits — separate from `AppUser.role`, which is
// the org-level role that gates whether you even see Settings.
//
// memberCount above is seeded to match each roster's length; the live count
// (after add/remove) comes from the members store, not this field.

export type WorkspaceMember = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export const WORKSPACE_MEMBERS: Record<string, WorkspaceMember[]> = {
  "ws-south": [
    { id: "wm-south-1", name: "Ankit Purohit", email: "ankit.purohit@guyjus.com", role: "admin" },
    { id: "wm-south-2", name: "Arjun Rao", email: "arjun.rao@guyjus.com", role: "admin" },
    { id: "wm-south-3", name: "Priya Menon", email: "priya.menon@guyjus.com", role: "member" },
    { id: "wm-south-4", name: "Rohan Shetty", email: "rohan.shetty@guyjus.com", role: "member" },
    { id: "wm-south-5", name: "Sneha Reddy", email: "sneha.reddy@guyjus.com", role: "member" },
    { id: "wm-south-6", name: "Vikram Nair", email: "vikram.nair@guyjus.com", role: "member" },
    { id: "wm-south-7", name: "Divya Pillai", email: "divya.pillai@guyjus.com", role: "member" },
    { id: "wm-south-8", name: "Aravind Kumar", email: "aravind.kumar@guyjus.com", role: "member" },
  ],
  "ws-ncr": [
    { id: "wm-ncr-1", name: "Ankit Purohit", email: "ankit.purohit@guyjus.com", role: "admin" },
    { id: "wm-ncr-2", name: "Neha Kapoor", email: "neha.kapoor@guyjus.com", role: "admin" },
    { id: "wm-ncr-3", name: "Sahil Chopra", email: "sahil.chopra@guyjus.com", role: "member" },
    { id: "wm-ncr-4", name: "Ishaan Malhotra", email: "ishaan.malhotra@guyjus.com", role: "member" },
    { id: "wm-ncr-5", name: "Riya Sharma", email: "riya.sharma@guyjus.com", role: "member" },
  ],
  "ws-mmr": [
    { id: "wm-mmr-1", name: "Ankit Purohit", email: "ankit.purohit@guyjus.com", role: "admin" },
    { id: "wm-mmr-2", name: "Karthik Iyer", email: "karthik.iyer@guyjus.com", role: "admin" },
    { id: "wm-mmr-3", name: "Aditya Joshi", email: "aditya.joshi@guyjus.com", role: "member" },
    { id: "wm-mmr-4", name: "Meera Deshpande", email: "meera.deshpande@guyjus.com", role: "member" },
    { id: "wm-mmr-5", name: "Saurabh Patil", email: "saurabh.patil@guyjus.com", role: "member" },
    { id: "wm-mmr-6", name: "Tanvi Kulkarni", email: "tanvi.kulkarni@guyjus.com", role: "member" },
    { id: "wm-mmr-7", name: "Nikhil More", email: "nikhil.more@guyjus.com", role: "member" },
    { id: "wm-mmr-8", name: "Pooja Bhatt", email: "pooja.bhatt@guyjus.com", role: "member" },
    { id: "wm-mmr-9", name: "Rahul Gokhale", email: "rahul.gokhale@guyjus.com", role: "member" },
  ],
};
