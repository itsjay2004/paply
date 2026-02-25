# Paply (Richie) - AI-Powered Research Paper Manager

Paply (internal name "Richie") is a modern, AI-enhanced tool designed for researchers and students to organize, manage, and understand academic papers efficiently.

## 🚀 Key Features

- **Centralized Library**: Manage all your research papers in one clean, responsive interface.
- **AI-Powered Summaries**: Instantly generate key insights and summaries from paper abstracts using Google Genkit and Gemini.
- **Seamless Import**: 
  - **DOI Import**: Add papers instantly by providing their Digital Object Identifier.
  - **PDF Import**: Upload PDF files and have the system automatically extract metadata.
- **Organized Collections**: Group your papers into custom collections for better project management.
- **Rich Metadata Editing**: Keep your library accurate by editing titles, authors, DOI, and publication details.
- **Integrated Sidebar**: Quick navigation between your full library, recent papers, and favorite collections.

## 🛠️ Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Authentication**: [Clerk](https://clerk.com/)
- **Database**: [Supabase](https://supabase.com/)
- **AI Implementation**: [Google Genkit](https://js.langchain.com/docs/get_started/introduction) + Gemini API
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) / [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📂 Project Structure

- `src/app/`: Next.js 15 pages and API routes.
- `src/components/`: Core UI components including the Workspace, Paper List, and Details Pane.
- `src/ai/`: Genkit flows and AI logic.
- `src/lib/`: Database clients, TypeScript types, and utility functions.
- `src/hooks/`: Custom React hooks (e.g., toast notifications).

## 📥 Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- A Supabase account and project
- A Clerk account and application
- A Gemini API key (via Google AI Studio)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/itsjay2004/paply.git
    cd paply-app
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up environment variables**:
    Create a `.env.local` file in the root directory and add the following:
    ```env
    # Clerk
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
    CLERK_SECRET_KEY=your_clerk_secret

    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

    # Genkit / Gemini
    GOOGLE_GENAI_API_KEY=your_gemini_api_key

    # AWS S3 (for storing uploaded PDFs)
    AWS_REGION=us-east-1
    AWS_ACCESS_KEY_ID=your_access_key_id
    AWS_SECRET_ACCESS_KEY=your_secret_access_key
    AWS_S3_PDF_BUCKET=your-bucket-name
    ```
    PDF import requires a configured S3 bucket and IAM credentials; see `docs/s3-pdf-storage-implementation-plan.md` for setup.

4.  **Run the development server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:9002](http://localhost:9002) in your browser.

## 🔧 Troubleshooting

### "Connect Timeout" or "fetch failed" when calling Supabase

If the terminal shows **Connect Timeout Error (attempted address: …supabase.co:443, timeout: 10000ms)** or **TypeError: fetch failed**, the machine running `npm run dev` cannot open a TCP connection to Supabase within 10 seconds. The app and env vars are fine; the issue is **network connectivity** from that machine to the internet (or to Supabase).

**Try:**

1. **Test from the same machine**  
   In a terminal on the **same machine** where you run `npm run dev`:

   - **Windows (PowerShell):** Use the real curl (if available) or PowerShell:
     ```powershell
     curl.exe -v --connect-timeout 15 https://YOUR_PROJECT_REF.supabase.co/rest/v1/
     ```
     If `curl.exe` is not found, use:
     ```powershell
     Invoke-WebRequest -Uri "https://YOUR_PROJECT_REF.supabase.co/rest/v1/" -TimeoutSec 15 -UseBasicParsing
     ```
   - **macOS / Linux / Git Bash:**
     ```bash
     curl -v --connect-timeout 15 https://YOUR_PROJECT_REF.supabase.co/rest/v1/
     ```

   Replace `YOUR_PROJECT_REF` with the hostname from `NEXT_PUBLIC_SUPABASE_URL` (e.g. `ntdwtbqjtkagdbsgvdtg`). If the command hangs or times out, the machine cannot reach Supabase.

2. **VPN / proxy**  
   Disable VPN or corporate proxy temporarily, or configure Node/Next to use your proxy if required.

3. **Firewall**  
   Allow outbound HTTPS (port 443) from the process running Node (or from your VM/host).

4. **Run the app from a different network**  
   Run `npm run dev` on a machine that has unrestricted internet (e.g. your main PC on home Wi‑Fi instead of a VM or locked-down network).

5. **VM / Docker**  
   If you develop inside a VM (e.g. 192.168.x.x), ensure it has **NAT or bridged** networking so it can reach the internet, not only host-only.

## 📄 License

This project is licensed under the MIT License.
