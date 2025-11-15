'use client';

import { useState } from 'react';
import type { AuthErrorInfo } from '@/types/auth-errors';
import { shouldShowDetailedErrors, getEnvironmentName } from '@/lib/env';

interface AuthErrorProps {
  error: AuthErrorInfo;
  technicalDetails?: string;
}

/**
 * Authentication error display component
 *
 * Shows different levels of detail based on environment:
 * - Development/Preview: Full error details with troubleshooting steps
 * - Production: Generic user-friendly error message
 */
export function AuthError({ error, technicalDetails }: AuthErrorProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const isDetailed = shouldShowDetailedErrors();

  const copyToClipboard = () => {
    const details = `
Error Code: ${error.code}
Title: ${error.title}
Environment: ${getEnvironmentName()}
User Message: ${error.userMessage}
Technical Message: ${error.technicalMessage}

Possible Causes:
${error.possibleCauses.map((cause, i) => `${i + 1}. ${cause}`).join('\n')}

Troubleshooting Steps:
${error.troubleshootingSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}
${technicalDetails ? `\nAdditional Details:\n${technicalDetails}` : ''}
    `.trim();

    void navigator.clipboard.writeText(details);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Production: Generic error message
  if (!isDetailed) {
    return (
      <div className="w-full max-w-md mx-auto mt-8 rounded-lg bg-red-500/10 border border-red-500/20 p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-200">
              {error.title}
            </h3>
            <p className="mt-2 text-sm text-red-100">{error.userMessage}</p>
            <div className="mt-4 flex gap-3">
              <a
                href="/auth/signin"
                className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"
              >
                Try Again
              </a>
              <a
                href="/"
                className="inline-flex items-center rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Development/Preview: Detailed error information
  return (
    <div className="w-full max-w-3xl mx-auto mt-8 space-y-4">
      {/* Environment Badge */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center rounded-md bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-400 ring-1 ring-inset ring-yellow-500/20">
          {getEnvironmentName()} Environment - Detailed Error Display
        </span>
        <button
          onClick={copyToClipboard}
          className="inline-flex items-center gap-2 rounded-md bg-gray-700 px-3 py-1 text-xs font-semibold text-gray-200 hover:bg-gray-600"
        >
          {copied ? (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z"
                />
              </svg>
              Copy Details
            </>
          )}
        </button>
      </div>

      {/* Main Error Card */}
      <div className="rounded-lg bg-red-500/10 border border-red-500/20 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-200">{error.title}</h3>
              <p className="mt-1 text-sm text-red-300 font-mono">
                Error Code: {error.code}
              </p>
              <p className="mt-3 text-base text-red-100">{error.userMessage}</p>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="border-t border-red-500/20 bg-red-500/5 p-6">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-sm font-semibold text-red-200">
              Technical Details
            </span>
            <svg
              className={`h-5 w-5 text-red-300 transform transition-transform ${
                showTechnicalDetails ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>

          {showTechnicalDetails && (
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-red-300 uppercase tracking-wide">
                  Technical Message
                </h4>
                <p className="mt-1 text-sm text-red-100 font-mono">
                  {error.technicalMessage}
                </p>
              </div>

              {technicalDetails && (
                <div>
                  <h4 className="text-xs font-semibold text-red-300 uppercase tracking-wide">
                    Additional Details
                  </h4>
                  <pre className="mt-1 text-xs text-red-100 font-mono overflow-x-auto bg-black/20 p-3 rounded">
                    {technicalDetails}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Possible Causes */}
      <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-6">
        <h4 className="text-sm font-semibold text-orange-200 flex items-center gap-2">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
            />
          </svg>
          Possible Causes
        </h4>
        <ul className="mt-3 space-y-2">
          {error.possibleCauses.map((cause, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-orange-100">
              <span className="flex-shrink-0 text-orange-400">•</span>
              <span>{cause}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Troubleshooting Steps */}
      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-6">
        <h4 className="text-sm font-semibold text-blue-200 flex items-center gap-2">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
            />
          </svg>
          Troubleshooting Steps
        </h4>
        <ol className="mt-3 space-y-2">
          {error.troubleshootingSteps.map((step, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-blue-100">
              <span className="flex-shrink-0 font-semibold text-blue-400">
                {index + 1}.
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <a
          href="/auth/signin"
          className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
        >
          Try Again
        </a>
        <a
          href="/"
          className="inline-flex items-center rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-600"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
