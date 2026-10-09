import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  CustomRequest,
  RequestBrief,
  RequestCustomer,
  RequestStatus,
  TimelineEvent,
} from '@/types'
import type { PieceConfig } from '@/lib/data/configurator'
import type { DesignConfiguration } from '@/lib/data/design'

/**
 * Custom marble requests — the demo's only "backend".
 *
 * Requests are held in Zustand and persisted to localStorage, so a request the
 * customer submits in the configurator is immediately visible in the admin
 * console during the same demo session. Nothing is sent over the network.
 */

const STORAGE_KEY = 'kosi-custom-requests'
const REQUEST_YEAR = 2026

let eventCounter = 0
const eventId = () => {
  eventCounter += 1
  return `ev-${Date.now().toString(36)}-${eventCounter}`
}

export function formatRequestId(sequence: number): string {
  return `MR-${REQUEST_YEAR}-${String(sequence).padStart(3, '0')}`
}

/** Indicative value only — there is no pricing engine in this demo. */
export function indicativeEstimate(config: PieceConfig): number {
  const { length, width } = config.dimensions
  const areaM2 = (length * width) / 10_000
  const stoneRate = config.marble === 'calacatta' || config.marble === 'crema' ? 2600 : 3200
  const baseCost = config.base === 'stone' || config.base === 'pedestal' ? 1800 : 1100
  return Math.round((areaM2 * stoneRate + baseCost) / 50) * 50
}

interface RequestsState {
  requests: CustomRequest[]
  sequence: number
  createRequest: (input: {
    config: PieceConfig
    customer: RequestCustomer
    brief: RequestBrief
    /** Full design-studio specification, when the request came from there. */
    design?: DesignConfiguration
    /** Data URL of the AI render, when one was generated. */
    generatedPreview?: string | null
  }) => CustomRequest
  setStatus: (id: string, status: RequestStatus) => void
  addNote: (id: string, body: string) => void
  logEvent: (id: string, kind: TimelineEvent['kind'], value?: string) => void
  prepareQuote: (id: string) => void
  reset: () => void
}

/** Two pre-loaded requests so the admin console is never empty on first run. */
const seedRequests: CustomRequest[] = [
  {
    id: 'MR-2026-001',
    createdAt: '2026-08-24T09:15:00.000Z',
    status: 'quoted',
    config: {
      piece: 'dining',
      marble: 'crema',
      shape: 'oval',
      edge: 'bullnose',
      base: 'pedestal',
      dimensions: { length: 280, width: 120, height: 75 },
    },
    customer: {
      name: 'نورة العتيبي',
      phone: '0551234567',
      email: 'noura@example.com',
      city: 'riyadh',
    },
    brief: {
      projectDescription:
        'طاولة طعام لمجلس عائلي يتسع لعشرة أشخاص، الأرضية رخام فاتح والإضاءة دافئة.',
      notes: 'الدور الأرضي، المدخل واسع، يُفضّل التسليم صباحًا.',
      referenceFiles: ['majlis-reference.jpg'],
    },
    timeline: [
      { id: 'ev-seed-1', kind: 'created', at: '2026-08-24T09:15:00.000Z' },
      { id: 'ev-seed-2', kind: 'contacted', at: '2026-08-24T13:40:00.000Z' },
      { id: 'ev-seed-3', kind: 'quote', at: '2026-08-25T10:05:00.000Z' },
      { id: 'ev-seed-4', kind: 'status', value: 'quoted', at: '2026-08-25T10:06:00.000Z' },
    ],
    notes: [
      {
        id: 'note-seed-1',
        body: 'تم تأكيد المقاسات مع العميلة. اللوح المطلوب متوفر.',
        at: '2026-08-25T10:00:00.000Z',
        author: 'فريق المبيعات',
      },
    ],
    estimate: 10500,
  },
  {
    id: 'MR-2026-002',
    createdAt: '2026-09-01T07:50:00.000Z',
    status: 'new',
    config: {
      piece: 'console',
      marble: 'nero',
      shape: 'rectangle',
      edge: 'beveled',
      base: 'architectural',
      dimensions: { length: 200, width: 42, height: 88 },
    },
    customer: {
      name: 'عبدالله الشمري',
      phone: '0509876543',
      email: 'abdullah@example.com',
      city: 'jeddah',
    },
    brief: {
      projectDescription: 'كونسول لمدخل فيلا، الجدار خلفه خشبي داكن.',
      notes: '',
      referenceFiles: [],
    },
    timeline: [{ id: 'ev-seed-5', kind: 'created', at: '2026-09-01T07:50:00.000Z' }],
    notes: [],
  },
]

/* --------------------------------------------------------------- storage */

/**
 * localStorage, but it degrades instead of throwing.
 *
 * Requests now carry the customer's reference photograph and, when they
 * generated one, an AI render — inline data URLs, a few hundred kilobytes each.
 * A handful of those will exhaust a 5MB origin quota during a long demo, and the
 * default persist adapter reacts to a failed write by throwing, which in this app
 * would mean losing a request the customer has just been told was received.
 *
 * So a rejected write is retried with the imagery stripped from the older
 * requests: every specification survives, the most recent preview survives, and
 * the oldest pictures are what get dropped. That is the right thing to lose.
 */
const imageTolerantStorage: Storage = {
  get length() {
    return window.localStorage.length
  },
  clear: () => window.localStorage.clear(),
  key: (index) => window.localStorage.key(index),
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* nothing to do */
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value)
      return
    } catch {
      /* over quota — fall through and shed imagery */
    }

    try {
      const parsed = JSON.parse(value) as {
        state?: { requests?: CustomRequest[] }
      }
      const requests = parsed.state?.requests
      if (!requests) return

      // Newest first in this store, so keep imagery on the first entry only.
      parsed.state!.requests = requests.map((request, index) =>
        index === 0
          ? request
          : {
              ...request,
              generatedPreview: null,
              design: request.design ? { ...request.design, referenceImage: null } : undefined,
            },
      )
      window.localStorage.setItem(key, JSON.stringify(parsed))
    } catch {
      // Still no room: the in-memory store is intact for this session, which is
      // what the demo actually needs.
    }
  },
}

export const useRequestsStore = create<RequestsState>()(
  persist(
    (set, get) => ({
      requests: seedRequests,
      sequence: seedRequests.length,

      createRequest: ({ config, customer, brief, design, generatedPreview }) => {
        const sequence = get().sequence + 1
        const now = new Date().toISOString()
        const request: CustomRequest = {
          id: formatRequestId(sequence),
          createdAt: now,
          status: 'new',
          config,
          customer,
          brief,
          timeline: [{ id: eventId(), kind: 'created', at: now }],
          notes: [],
          design,
          generatedPreview: generatedPreview ?? null,
        }

        set({ requests: [request, ...get().requests], sequence })
        return request
      },

      logEvent: (id, kind, value) => {
        set({
          requests: get().requests.map((request) =>
            request.id === id
              ? {
                  ...request,
                  timeline: [
                    ...request.timeline,
                    { id: eventId(), kind, value, at: new Date().toISOString() },
                  ],
                }
              : request,
          ),
        })
      },

      setStatus: (id, status) => {
        set({
          requests: get().requests.map((request) =>
            request.id === id
              ? {
                  ...request,
                  status,
                  timeline: [
                    ...request.timeline,
                    {
                      id: eventId(),
                      kind: status === 'contacted' ? 'contacted' : 'status',
                      value: status,
                      at: new Date().toISOString(),
                    },
                  ],
                }
              : request,
          ),
        })
      },

      addNote: (id, body) => {
        const trimmed = body.trim()
        if (!trimmed) return
        const now = new Date().toISOString()
        set({
          requests: get().requests.map((request) =>
            request.id === id
              ? {
                  ...request,
                  notes: [
                    ...request.notes,
                    { id: eventId(), body: trimmed, at: now, author: 'Admin' },
                  ],
                  timeline: [...request.timeline, { id: eventId(), kind: 'note', at: now }],
                }
              : request,
          ),
        })
      },

      prepareQuote: (id) => {
        const now = new Date().toISOString()
        set({
          requests: get().requests.map((request) =>
            request.id === id
              ? {
                  ...request,
                  estimate: indicativeEstimate(request.config),
                  status: request.status === 'new' ? 'quoted' : request.status,
                  timeline: [...request.timeline, { id: eventId(), kind: 'quote', at: now }],
                }
              : request,
          ),
        })
      },

      reset: () => set({ requests: seedRequests, sequence: seedRequests.length }),
    }),
    { name: STORAGE_KEY, storage: createJSONStorage(() => imageTolerantStorage) },
  ),
)

export const requestById = (requests: CustomRequest[], id: string) =>
  requests.find((request) => request.id === id)
