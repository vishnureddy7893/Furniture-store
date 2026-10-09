> **Note — this repository now hosts the client demo for**
> **AL MANARAT AL ANEEQA FACTORY MARBLE & STONE / مصنع المنارات الأنيقة للرخام والحجر.**
> It has been transformed into an Arabic-first demo for a premium Saudi
> natural-marble furniture brand. All products, prices, orders and custom
> requests are mock data; no payment, shipping or messaging service is
> contacted. See [`docs/DEMO-COMPLETION.md`](docs/DEMO-COMPLETION.md) for what
> was built and [`docs/IMPLEMENTATION-PLAN.md`](docs/IMPLEMENTATION-PLAN.md)
> for how. The sections below describe the original storefront and are kept
> for reference.

> 💼 A project by [BebsharDost](https://bebshardost.com) - Your Digital Dost

# 🛋️ Kosi Furniture Store - Premium E-commerce Platform

![Kosi Furniture Banner](.github/screenshots/kosii-banner.png)

A modern, responsive furniture e-commerce platform built with Next.js 15, featuring a seamless shopping experience with cart functionality, checkout process, and multiple payment options.

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## ✨ Features

### 🛒 E-commerce Functionality
- **Shopping Cart** - Add, remove, and manage items with real-time updates
- **Checkout Process** - Multi-step checkout with form validation
- **Payment Options** - Support for COD, bKash, and Nagad payments
- **Order Management** - Order confirmation and tracking system

### 🎨 Modern Design
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Smooth Animations** - Framer Motion inspired transitions
- **Modern UI/UX** - Clean, elegant interface with premium feel
- **Dark/Light Mode Ready** - Built with theming in mind

### ⚡ Performance & SEO
- **Next.js 15** - Latest App Router with React 18
- **TypeScript** - Full type safety and better developer experience
- **SEO Optimized** - Meta tags, sitemap, and structured data
- **Image Optimization** - Next.js Image component with lazy loading

### 🔧 Developer Experience
- **Zustand** - Lightweight state management
- **Lucide React** - Beautiful, tree-shakeable icons
- **PNPM** - Fast, disk space efficient package manager
- **ESLint & Prettier** - Code quality and formatting

## 🚀 Live Demo

🌐 **Live Site**: [https://kosii.netlify.app](https://kosii.netlify.app)

## 📸 Screenshots

| Homepage | Product Gallery | Shopping Cart |
|----------|-----------------|---------------|
| ![Homepage](.github/screenshots/kosii-banner.png) | ![Products](.github/screenshots/kosii-products.png) | ![Cart](.github/screenshots/kosii-cart.png) |

| Checkout | Order Success | Mobile View |
|----------|---------------|-------------|
| ![Checkout](.github/screenshots/kosii-checkout.png) | ![Success](.github/screenshots/kosii-success.png) | ![Mobile](.github/screenshots/kosii-mobile.png) |

## 🛠️ Tech Stack

**Frontend Framework**
- [Next.js 15](https://nextjs.org/) - React framework with App Router
- [React 18](https://reactjs.org/) - UI library with latest features
- [TypeScript](https://www.typescriptlang.org/) - Type safety and better DX

**Styling & UI**
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide React](https://lucide.dev/) - Beautiful SVG icons

**State Management**
- [Zustand](https://github.com/pmndrs/zustand) - Lightweight state management

**Development Tools**
- [PNPM](https://pnpm.io/) - Fast, disk space efficient package manager
- [ESLint](https://eslint.org/) - Code linting and quality
- [PostCSS](https://postcss.org/) - CSS processing

## 📦 Installation

### Prerequisites
- Node.js 18.17 or later
- PNPM (recommended) or npm

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/kosi-furniture.git
   cd kosi-furniture
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Run the development server**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## 🗂️ Project Structure

```
kosi-furniture-store/
├── app/                    # Next.js 15 App Router
│   ├── cart/              # Cart page
│   ├── checkout/          # Checkout process
│   ├── order-success/     # Order confirmation
│   └── layout.tsx         # Root layout
├── components/
│   ├── layouts/           # Header, Footer
│   ├── pages/             # Page components
│   ├── sections/          # Homepage sections
│   └── ui/                # Reusable UI components
├── lib/
│   ├── store/             # Zustand stores
│   └── mock-data.ts       # Sample product data
├── public/                # Static assets
└── types/                 # TypeScript type definitions
```

## 🎯 Key Pages & Features

### 🏠 Homepage
- Hero section with featured products
- Top picks with filtering and sorting
- New arrivals showcase
- Feature highlights
- Inspiration gallery

### 🛒 Shopping Experience
- **Product Catalog** - Grid/list view with categories
- **Product Details** - Images, ratings, add to cart
- **Shopping Cart** - Quantity management, item removal
- **Wishlist** - Save products for later

### 💳 Checkout Process
- **Shipping Information** - Address and contact details
- **Payment Method** - COD, bKash, or Nagad
- **Order Review** - Final confirmation before purchase
- **Order Success** - Confirmation with tracking details

### 📱 Responsive Design
- Mobile-first approach
- Tablet and desktop optimizations
- Touch-friendly interfaces
- Fast loading on all devices

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for environment variables:

```env
# Next.js Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.netlify.app
NEXT_PUBLIC_APP_NAME=Kosi Furniture

# API Endpoints (for future integration)
NEXT_PUBLIC_API_URL=your-api-url
```

### Customization
- **Colors**: Update `tailwind.config.js` for brand colors
- **Fonts**: Modify `layout.tsx` for custom fonts
- **Content**: Edit mock data in `lib/mock-data.ts`
- **SEO**: Update metadata in layout and pages

## 🚀 Deployment

### Netlify (Recommended)
1. Connect your GitHub repository to Netlify
2. Set build command: `pnpm build`
3. Set publish directory: `.next`
4. Deploy!

### Vercel
1. Import project from GitHub
2. Vercel automatically detects Next.js
3. Deploy with zero configuration

### Other Platforms
The project can be deployed on any platform that supports Next.js:
- AWS Amplify
- Railway
- Digital Ocean App Platform
- Heroku (with buildpack)

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues, feature requests, or pull requests.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Use TypeScript for type safety
- Follow Tailwind CSS class ordering
- Write meaningful commit messages
- Test responsive design on multiple devices

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

Built with ❤️ by **[BebsharDost](https://bebshardost.com)**

**Agency**: [BebsharDost](https://bebshardost.com) - Your Digital Dost  
Specializing in: Modern web applications, e-commerce solutions, and digital experiences.

📧 **Contact**: [bebshardost@gmail.com](mailto:bebshardost@gmail.com) 
🌐 **Website**: [bebshardost.com](https://bebshardost.com)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS
- Lucide for the beautiful icons
- Zustand for simple state management

---

<div align="center">

⭐ Star this repo if you found it helpful!

![GitHub stars](https://img.shields.io/github/stars/bebshardost/kosi-furniture-store?style=social)
![GitHub forks](https://img.shields.io/github/forks/bebshardost/kosi-furniture-store?style=social)

</div>
