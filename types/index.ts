import type { Localized } from '@/lib/i18n/config'
import type { MarbleId, PieceConfig } from '@/lib/data/configurator'
import type { DesignConfiguration } from '@/lib/data/design'

/**
 * The original storefront `Product` shape is kept intact so the existing cart
 * store, cart page and checkout keep working unchanged. The marble catalogue
 * adds bilingual and stone-specific fields on top of it.
 */
export interface Product {
  id: string | number
  title: string
  price: number
  oldPrice?: number
  image: string
  category: string
  badgeText?: string
  className?: string
  rating?: number
  reviews?: number
  isNew?: boolean
  isBestSeller?: boolean
  quantity?: number
  /** Bilingual product name; falls back to `title` when absent. */
  name?: Localized
  /** Bilingual category name; falls back to `category`. */
  categoryName?: Localized
  /** Drives the generated marble imagery for this piece. */
  config?: PieceConfig
  slug?: string
}

export type CategorySlug =
  | 'dining-tables'
  | 'coffee-tables'
  | 'side-tables'
  | 'consoles'
  | 'buffets'
  | 'tv-tables'

export interface Category {
  slug: CategorySlug
  name: Localized
  description: Localized
  /** Config used to draw the category thumbnail. */
  config: PieceConfig
}

export interface MarbleProduct extends Product {
  id: string
  slug: string
  name: Localized
  categorySlug: CategorySlug
  categoryName: Localized
  config: PieceConfig
  marbleId: MarbleId
  sku: string
  stock: number
  /** Working days before dispatch. */
  leadTimeDays: number
  weightKg: number
  description: Localized
  features: Localized[]
  warranty: Localized
  /**
   * Optional slab photography. Empty in this demo — imagery is generated from
   * `config`; drop real image URLs in here to switch to photography.
   */
  images: string[]
}

export interface CartItem extends Product {
  quantity: number
}

export interface CartStore {
  cartItems: CartItem[]
  totalQuantity: number
  totalPrice: number
  addToCart: (product: Product) => void
  removeFromCart: (id: string | number) => void
  increaseQuantity: (id: string | number) => void
  decreaseQuantity: (id: string | number) => void
  clearCart: () => void
}

export interface ShippingAddress {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  /** Access and installation notes — marble pieces are heavy. */
  accessNotes?: string
}

export interface PaymentMethod {
  type: 'cod' | 'transfer' | 'card'
  details?: {
    phone?: string
    transactionId?: string
  }
}

export interface Order {
  id: string
  items: CartItem[]
  shippingAddress: ShippingAddress
  paymentMethod: PaymentMethod
  subtotal: number
  shipping: number
  tax: number
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered'
  createdAt: Date
}

/* ------------------------------------------------------- custom requests */

export const REQUEST_STATUSES = [
  'new',
  'contacted',
  'quoted',
  'production',
  'delivered',
] as const
export type RequestStatus = (typeof REQUEST_STATUSES)[number]

export interface RequestCustomer {
  name: string
  phone: string
  email: string
  city: string
}

export interface RequestBrief {
  projectDescription: string
  notes: string
  /** Reference file names supplied by the customer (nothing is uploaded). */
  referenceFiles: string[]
}

export type TimelineEventKind = 'created' | 'status' | 'note' | 'quote' | 'contacted'

export interface TimelineEvent {
  id: string
  kind: TimelineEventKind
  /** Extra detail, e.g. the new status key. */
  value?: string
  at: string
}

export interface InternalNote {
  id: string
  body: string
  at: string
  author: string
}

export interface CustomRequest {
  id: string
  createdAt: string
  status: RequestStatus
  config: PieceConfig
  customer: RequestCustomer
  brief: RequestBrief
  timeline: TimelineEvent[]
  notes: InternalNote[]
  /** Indicative value produced by the mock quotation action, in SAR. */
  estimate?: number
  /**
   * The full design-studio configuration, when the request came from there.
   * `config` above is its projection onto the storefront shape; this is the
   * authoritative specification, including finish, thickness, vein direction and
   * the customer's reference photograph.
   */
  design?: DesignConfiguration
  /** Data URL of the AI render, when the customer generated one. */
  generatedPreview?: string | null
}
