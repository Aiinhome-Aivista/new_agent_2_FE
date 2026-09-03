export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    ME: '/auth/me',
  },
  USERS: {
    LIST_BY_ROLE: (role: string) => `/users/?role=${role}`,
  },
  DASHBOARD: {
    STATS: '/dashboard/stats',
  },
  PROJECTS: {
    LIST: '/projects/',
    CREATE: '/projects/',
    GENERATE_DESC: '/projects/generate-description',
    DETAIL: (id: string | number) => `/projects/${id}`,
    STAKEHOLDERS: (id: string | number) => `/projects/${id}/stakeholders/`,
    STAKEHOLDER_DETAIL: (projectId: string | number, userId: string | number) => `/projects/${projectId}/stakeholders/${userId}`,
    TEMPLATE: (id: string | number) => `/projects/${id}/stakeholders/template`,
    BULK_UPLOAD: (id: string | number) => `/projects/${id}/stakeholders/bulk-upload`,
    MEMBERS: (id: string | number) => `/projects/${id}/members/`, // Assuming this exists or similar
  },
  DOCUMENTS: {
    LIST: (projectId: string | number) => `/projects/${projectId}/documents/`,
    TYPES: (projectId: string | number) => `/projects/${projectId}/documents/types`,
    PROCESS: (projectId: string | number, docId: string | number) => `/projects/${projectId}/documents/${docId}/process`,
    DETAIL: (projectId: string | number, docId: string | number) => `/projects/${projectId}/documents/${docId}`,
    CONFIRM_UPLOAD: (projectId: string | number) => `/projects/${projectId}/documents/confirm-upload`,
    DOWNLOAD: (projectId: string | number, docId: string | number) => `/projects/${projectId}/documents/${docId}/download`,
  },
  BASELINE: {
    LIST: (projectId: string | number) => `/projects/${projectId}/baseline/`,
    VERSIONS: (projectId: string | number) => `/projects/${projectId}/baseline/versions`,
    APPROVE: (projectId: string | number) => `/projects/${projectId}/baseline/approve`,
    ITEMS: (projectId: string | number) => `/projects/${projectId}/baseline/items`,
    ITEM_DETAIL: (projectId: string | number, itemId: string | number) => `/projects/${projectId}/baseline/items/${itemId}`,
    ITEM_COMPLETION: (projectId: string | number, itemId: string | number) => `/projects/${projectId}/baseline/items/${itemId}/completion`,
    EXTRACT: (projectId: string | number, docId: string | number) => `/projects/${projectId}/baseline/extract?document_id=${docId}`,
  },

  TRACKER: {
    LIST: (projectId: string | number) => `/projects/${projectId}/tracker/`,
    ITEM: (projectId: string | number, itemId: string | number) => `/projects/${projectId}/tracker/${itemId}`,
    RESOLVE: (projectId: string | number, itemId: string | number) => `/projects/${projectId}/tracker/${itemId}/resolve`,
    REACTIVATE: (projectId: string | number, itemId: string | number) => `/projects/${projectId}/tracker/${itemId}/reactivate`,
    CONFIRM_RESOLUTION: (projectId: string | number, itemId: string | number) => `/projects/${projectId}/tracker/${itemId}/confirm-resolution`,
    DISMISS_SUGGESTION: (projectId: string | number, itemId: string | number) => `/projects/${projectId}/tracker/${itemId}/dismiss-suggestion`,
  },
  MONITORING: {
    PROGRESS: (projectId: string | number) => `/projects/${projectId}/monitoring/progress`,
  },
  DRIVE: {
    ACCOUNTS: '/drive/accounts',
    ACCOUNT_DETAIL: (id: string | number) => `/drive/accounts/${id}`,
    INBOX: '/drive/inbox',
    INBOX_BY_PROJECT: (projectId: string | number) => `/drive/inbox?project_id=${projectId}`,
    SYNC: '/drive/sync',
    PROCESS_INBOX: (inboxId: string | number) => `/drive/inbox/${inboxId}/process`,
    SKIP_INBOX: (inboxId: string | number) => `/drive/inbox/${inboxId}/skip`,
    RESUME_INBOX: (inboxId: string | number) => `/drive/inbox/${inboxId}/resume`,
    ASSIGN_INBOX: (inboxId: string | number) => `/drive/inbox/${inboxId}/assign`,
    DELETE_INBOX: (inboxId: string | number) => `/drive/inbox/${inboxId}`,
  },
  ONEDRIVE: {
    ACCOUNTS: '/onedrive/accounts',
    ACCOUNT_DETAIL: (id: string | number) => `/onedrive/accounts/${id}`,
    INBOX: '/onedrive/inbox',
    INBOX_BY_PROJECT: (projectId: string | number) => `/onedrive/inbox?project_id=${projectId}`,
    SYNC: '/onedrive/sync',
    PROCESS_INBOX: (inboxId: string | number) => `/onedrive/inbox/${inboxId}/process`,
    SKIP_INBOX: (inboxId: string | number) => `/onedrive/inbox/${inboxId}/skip`,
    RESUME_INBOX: (inboxId: string | number) => `/onedrive/inbox/${inboxId}/resume`,
    ASSIGN_INBOX: (inboxId: string | number) => `/onedrive/inbox/${inboxId}/assign`,
    DELETE_INBOX: (inboxId: string | number) => `/onedrive/inbox/${inboxId}`,
  },
  RAG: {
    SESSIONS: (projectId: string | number) => `/projects/${projectId}/rag/sessions`,
    SESSION_DETAIL: (projectId: string | number, sessionId: string | number) => `/projects/${projectId}/rag/sessions/${sessionId}`,
    MESSAGES: (projectId: string | number, sessionId: string | number) => `/projects/${projectId}/rag/sessions/${sessionId}/messages`,
  }
};
