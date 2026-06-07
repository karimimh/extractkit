"use client";
import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-24 sm:pb-20">
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[var(--text-primary)] mb-6 tracking-tight">
            Your thoughts,
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              beautifully organized
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-[var(--text-secondary)] mb-12 max-w-3xl mx-auto leading-relaxed">
            A modern, intuitive note-taking app that adapts to your workflow. Capture ideas,
            organize with labels, and find what you need instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/notes/register"
              className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Start for Free
            </Link>
            <Link
              to="/notes/login"
              className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-xl text-[var(--text-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border-2 border-[var(--border-primary)] transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
            Everything you need to stay organized
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Powerful features designed to help you capture, organize, and retrieve your notes
            effortlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-blue-500 transition-all duration-200 hover:shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              Rich Text & Markdown
            </h3>
            <p className="text-[var(--text-secondary)]">
              Write with markdown support, add images, and format your notes exactly how you want.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-blue-500 transition-all duration-200 hover:shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Smart Labels</h3>
            <p className="text-[var(--text-secondary)]">
              Organize notes with custom labels and filter to find exactly what you need in seconds.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-blue-500 transition-all duration-200 hover:shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              Powerful Search
            </h3>
            <p className="text-[var(--text-secondary)]">
              Find any note instantly with our fast, full-text search across all your content.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-blue-500 transition-all duration-200 hover:shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Color Coding</h3>
            <p className="text-[var(--text-secondary)]">
              Personalize your notes with colors to visually distinguish different topics at a
              glance.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-blue-500 transition-all duration-200 hover:shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              Pin Important Notes
            </h3>
            <p className="text-[var(--text-secondary)]">
              Pin important notes to the top to keep your most critical information always
              accessible.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-blue-500 transition-all duration-200 hover:shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Mobile Ready</h3>
            <p className="text-[var(--text-secondary)]">
              Access your notes anywhere with our fully responsive design and PWA support.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 p-12 sm:p-16 text-center shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to get organized?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have transformed the way they take notes.
          </p>
          <Link
            to="/notes/register"
            className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-xl text-blue-600 bg-white hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            Create Your Free Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
