# Paply

> **Research Without Friction.**  
> An open-source, AI-powered reference manager built for modern researchers.

Paply helps researchers organize, read, annotate, and summarize academic papers in one intelligent workspace.


# Paply

<p align="center">
  <b>Research Without Friction.</b><br/>
  An open-source, AI-powered reference manager built for modern researchers.
</p>

<p align="center">

  <!-- License -->
  <img src="https://img.shields.io/github/license/itsjay2004/paply?style=for-the-badge" />

  <!-- Stars -->
  <img src="https://img.shields.io/github/stars/itsjay2004/paply?style=for-the-badge" />

  <!-- Forks -->
  <img src="https://img.shields.io/github/forks/itsjay2004/paply?style=for-the-badge" />

  <!-- Issues -->
  <img src="https://img.shields.io/github/issues/itsjay2004/paply?style=for-the-badge" />

  <!-- Last Commit -->
  <img src="https://img.shields.io/github/last-commit/itsjay2004/paply?style=for-the-badge" />

  <!-- Next.js -->
  <img src="https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=nextdotjs" />

  <!-- Supabase -->
  <img src="https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />

  <!-- TypeScript -->
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />

  <!-- Tailwind -->
  <img src="https://img.shields.io/badge/Styled%20with-TailwindCSS-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" />

</p>

---

Paply helps researchers organize, read, annotate, and summarize academic papers in one intelligent workspace.


## ✨ Features

- 🔎 **Smart Search & DOI Lookup**  
  Fetch metadata, abstracts, and citation details instantly.

- ✏ **Organized Collections**
  Group your papers into custom collections for better project management.

- 🤖 **AI-Powered Summaries**  
  Generate structured summaries covering context, methods, findings, and conclusions and see all your papers summaries in one table.

- 📄 **Advanced PDF Viewer**  
  Highlight, annotate, and extract insights directly inside your browser. And sync those annotated PDFs across devices.

- 📚 **Research Notebook**  
  A fully featured notetaking editor to make your academic writing seemless.

- 🔐 **Privacy First**  
  Your library is private and securely stored.

- 🧠 **Modern UX**  
  Clean, fast, distraction-free interface built for serious work.
  

## 🛠️ Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Authentication**: [Clerk](https://clerk.com/)
- **Database & Storage**: [Supabase](https://supabase.com/) and [AWS S3](https://aws.amazon.com/s3/)
- **AI Implementation**: [Google Genkit](https://js.langchain.com/docs/get_started/introduction) + Gemini API
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) / [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **PDF Engine**: [react-pdf-viewer](https://react-pdf-viewer.dev/)
- **Text Editor**: [Tiptap](https://tiptap.dev/) (Rich-text research notebook)


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
- A AWS account and S3 bucket
- A Clerk account and application
- A Gemini API key (via Google AI Studio)
- Openalex API key (Free)

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
    
    # Optional: Set your app URL for S3 CORS (defaults to * for development)
    NEXT_PUBLIC_APP_URL=http://localhost:9002

    # Openalex (for fetching paper metadata using DOI)
    ```
    PDF import requires a configured S3 bucket and IAM credentials; see `docs/s3-pdf-storage-implementation-plan.md` for setup.

4.  **Configure S3 CORS** (required for direct client uploads):
    ```bash
    node scripts/configure-s3-cors.js
    ```
    This script configures your S3 bucket to allow cross-origin PUT requests from your application. Make sure your AWS credentials have `s3:PutBucketCors` permission.
    
    Alternatively, you can configure CORS manually in the AWS Console:
    - Go to your S3 bucket → Permissions → Cross-origin resource sharing (CORS)
    - Add the following configuration:
    ```json
    [
      {
        "AllowedHeaders": [
          "Content-Type",
          "Content-MD5",
          "x-amz-content-sha256",
          "x-amz-date",
          "x-amz-security-token",
          "x-amz-user-agent",
          "x-amz-checksum-crc32",
          "x-amz-sdk-checksum-algorithm"
        ],
        "AllowedMethods": ["PUT", "POST", "GET", "HEAD", "OPTIONS"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag", "x-amz-request-id"],
        "MaxAgeSeconds": 3600
      }
    ]
    ```
    **Note**: Replace `"*"` with your specific domain in production (e.g., `["https://yourdomain.com"]`).

4.  **Run the development server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:9002](http://localhost:9002) in your browser.


## 🧪 Vision

Paply exists to modernize the research workflow.

Traditional reference managers were built for storing citations.  
Paply is built for *thinking, synthesizing, and writing*.

Our vision is to create a research platform that combines:

- Intelligent automation  
- Clean, distraction-free design  
- Open transparency  
- Privacy-first architecture  
- Research-centered workflows

Built for researchers. By a researcher.


## 🤝 Contributing

We welcome contributions from developers, researchers, and designers.

Paply is an open-source project and community-driven.

### How to Contribute

1. Fork the repository  
2. Create your feature branch (`git checkout -b feature/amazing-feature`)  
3. Commit your changes (`git commit -m 'Add amazing feature'`)  
4. Push to the branch (`git push origin feature/amazing-feature`)  
5. Open a Pull Request  

For major changes, please open an issue first to discuss what you would like to improve.

Let’s build better research tools together.


## 🔐 Privacy & Philosophy

Research should be open. Your data should not be.

Paply is built on the belief that research tools must be:

- Transparent
- Privacy-respecting
- Community-driven
- Free from hidden tracking

We do not sell user data.  
We do not track unnecessary analytics.  
Your research library belongs to you.

Open science deserves open tools — without compromising personal privacy.


## 📬 Contact

Have feedback, suggestions, or ideas?

We’d love to hear from you.

- 📧 Email: itsjaybauri1233@gmail.com 
- 🐛 GitHub Issues: Open an issue in this repository  

If you're a researcher using Paply in your academic work, feel free to reach out — we'd love to learn how you're using it.


## 📄 License

This project is licensed under the MIT License.
