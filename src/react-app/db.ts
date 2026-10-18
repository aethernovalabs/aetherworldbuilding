import Dexie from 'dexie';

export interface Project {
  id?: number;
  name: string;
  desc?: string;
  createdAt: string;
  lastUpdated: string;
}

export interface Character {
  id?: number;
  projectId: number;
  name: string;
  data: Record<string, unknown>;
  lastUpdated: string;
}

export interface Element {
  id?: number;
  projectId: number;
  name: string;
  type: string;
  data: Record<string, unknown>;
  lastUpdated: string;
}

export interface Event {
  id?: number;
  projectId: number;
  name: string;
  data: Record<string, unknown>;
  lastUpdated: string;
}

export interface MapData {
  id?: number;
  projectId: number;
  name: string;
  svgData: string;
  nodes: Record<string, unknown>[];
  paths: Record<string, unknown>[];
  lastUpdated: string;
}

export interface Document {
  id?: number;
  projectId: number;
  name: string;
  data: Record<string, unknown>;
  lastUpdated: string;
}

export interface ActivityLog {
  id?: number;
  projectId: number;
  action: 'create' | 'update' | 'delete';
  entityType: 'character' | 'element' | 'event' | 'map' | 'document' | 'project';
  entityId: number;
  entityName: string;
  timestamp: string;
  details?: string;
}

export class AetherDB extends Dexie {
  projects!: Dexie.Table<Project, number>;
  characters!: Dexie.Table<Character, number>;
  elements!: Dexie.Table<Element, number>;
  events!: Dexie.Table<Event, number>;
  maps!: Dexie.Table<MapData, number>;
  documents!: Dexie.Table<Document, number>;
  activityLog!: Dexie.Table<ActivityLog, number>;

  constructor() {
    super('aethernova');
    this.version(1).stores({
      projects: '++id, name, createdAt, lastUpdated',
      characters: '++id, projectId, name, lastUpdated',
      elements: '++id, projectId, name, type, lastUpdated',
      events: '++id, projectId, name, lastUpdated',
      maps: '++id, projectId, name, lastUpdated',
      documents: '++id, projectId, name, lastUpdated',
      activityLog: '++id, projectId, entityType, entityId, timestamp',
    });
  }
}

export const db = new AetherDB();

// Helper functions for activity logging
export async function logActivity(
  projectId: number,
  action: ActivityLog['action'],
  entityType: ActivityLog['entityType'],
  entityId: number,
  entityName: string,
  details?: string
) {
  await db.activityLog.add({
    projectId,
    action,
    entityType,
    entityId,
    entityName,
    timestamp: new Date().toISOString(),
    details,
  });
}

// Get recent activity for a project
export async function getRecentActivity(projectId: number, limit = 10) {
  return db.activityLog
    .where('projectId')
    .equals(projectId)
    .reverse()
    .sortBy('timestamp')
    .then((logs) => logs.slice(0, limit));
}

// Count entities for a project
export async function getProjectStats(projectId: number) {
  const [characters, elements, events, maps, documents] = await Promise.all([
    db.characters.where('projectId').equals(projectId).count(),
    db.elements.where('projectId').equals(projectId).count(),
    db.events.where('projectId').equals(projectId).count(),
    db.maps.where('projectId').equals(projectId).count(),
    db.documents.where('projectId').equals(projectId).count(),
  ]);
  return { characters, elements, events, maps, documents };
}

// Export all data for a project as JSON
export async function exportProjectData(projectId: number) {
  const [project, characters, elements, events, maps, documents] = await Promise.all([
    db.projects.get(projectId),
    db.characters.where('projectId').equals(projectId).toArray(),
    db.elements.where('projectId').equals(projectId).toArray(),
    db.events.where('projectId').equals(projectId).toArray(),
    db.maps.where('projectId').equals(projectId).toArray(),
    db.documents.where('projectId').equals(projectId).toArray(),
  ]);
  return { project, characters, elements, events, maps, documents };
}

// Import data for a project
export async function importProjectData(
  projectId: number,
  data: {
    characters?: Character[];
    elements?: Element[];
    events?: Event[];
    maps?: MapData[];
    documents?: Document[];
  }
) {
  await db.transaction('rw', [db.characters, db.elements, db.events, db.maps, db.documents], async () => {
    if (data.characters) {
      for (const c of data.characters) {
        await db.characters.put({ ...c, projectId });
      }
    }
    if (data.elements) {
      for (const e of data.elements) {
        await db.elements.put({ ...e, projectId });
      }
    }
    if (data.events) {
      for (const e of data.events) {
        await db.events.put({ ...e, projectId });
      }
    }
    if (data.maps) {
      for (const m of data.maps) {
        await db.maps.put({ ...m, projectId });
      }
    }
    if (data.documents) {
      for (const d of data.documents) {
        await db.documents.put({ ...d, projectId });
      }
    }
  });
}

// Delete project and all related data
export async function deleteProject(projectId: number) {
  await db.transaction('rw', [db.projects, db.characters, db.elements, db.events, db.maps, db.documents, db.activityLog], async () => {
    await db.projects.delete(projectId);
    await db.characters.where('projectId').equals(projectId).delete();
    await db.elements.where('projectId').equals(projectId).delete();
    await db.events.where('projectId').equals(projectId).delete();
    await db.maps.where('projectId').equals(projectId).delete();
    await db.documents.where('projectId').equals(projectId).delete();
    await db.activityLog.where('projectId').equals(projectId).delete();
  });
}

export default db;