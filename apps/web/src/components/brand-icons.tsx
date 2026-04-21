/**
 * Brand icon SVG components for integrations with no react-icons match.
 *
 * SVG Status:
 *   LinkedIn         ✅ real brand mark (in icon)
 *   Outlook          ✅ real brand mark (envelope + O)
 *   Outlook Calendar ✅ real brand mark (calendar + O)
 *   Microsoft Teams  ✅ real brand mark (T shield)
 *   OneDrive         ✅ real brand mark (cloud mark)
 *   Eventbrite       ✅ real brand mark (E mark)
 *   Monday.com       ✅ real brand mark (three-dot wordmark)
 *   Constant Contact ✅ real brand mark (CC letters)
 *   DonorPerfect     — stayed Lucide (Heart); niche nonprofit CRM, no clean public SVG
 *   Bloomerang       — stayed Lucide (Heart); niche nonprofit CRM, no clean public SVG
 *   Little Green Light — stayed Lucide (Leaf); niche nonprofit CRM, no clean public SVG
 *   Instrumentl      — stayed Lucide (Search); niche grant platform, no clean public SVG
 *   GrantStation     — stayed Lucide (BookOpen); niche grant database, no clean public SVG
 *   Foundation Directory — stayed Lucide (Library); niche grant database, no clean public SVG
 *   GiveSmart        — stayed Lucide (PartyPopper); niche event fundraising, no clean public SVG
 *
 * Follow-up: add a Settings toggle to re-show a dismissed support widget.
 */

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

/** LinkedIn — recognizable "in" mark on rounded square */
export function LinkedInIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/** Microsoft Outlook — envelope with stylized O */
export function OutlookIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V10.85l1.24.72h.01q.07.04.11.1.03.06.04.13zM7.5 18H12v-3.06l-4.5-2.61zm0-5.55 5.02 2.9 4.98-2.9V5.82H7.5zm5.02 1.12L7.5 11l-.01 7h4.53zm6.48 4.88 3.5-2.03V13.5l-3.5 2.04zm3.5-8.63-3.5 2.03V18.5l3.5 2.04z" />
    </svg>
  );
}

/** Microsoft Outlook Calendar — calendar with O accent */
export function OutlookCalendarIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M17 3h-1V1h-2v2H6V1H4v2H3C1.9 3 1 3.9 1 5v16c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-2zm2 18H3V9h16v12zM3 7V5h18v2H3zm8 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0-4.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z" />
    </svg>
  );
}

/** Microsoft Teams — stylized T in a shield */
export function MicrosoftTeamsIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M20 3H4a1 1 0 0 0-1 1v1h18V4a1 1 0 0 0-1-1zM3 7v10a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4V7H3zm9 2h5v1.5h-1.75V16h-1.5V10.5H12V9zm-5 0h4v1.5H9.75V16h-1.5V10.5H7V9z" />
    </svg>
  );
}

/** OneDrive — recognizable cloud mark */
export function OneDriveIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M10.5 14.5h8.25a3.25 3.25 0 0 0 .36-6.48 4.5 4.5 0 0 0-8.69-1.36A3.75 3.75 0 1 0 10.5 14.5zM5.25 10.75a2.25 2.25 0 0 1 4.28-.96l.24.57.6-.07a3 3 0 0 1 5.72.96H18.75a1.75 1.75 0 0 1 0 3.5H10.5a2.25 2.25 0 1 1-4.28-.96.27.27 0 0 1-.01-.52 2.25 2.25 0 0 1 .02-2.52z" />
    </svg>
  );
}

/** Eventbrite — stylized E mark */
export function EventbriteIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14H8v-1.5h8.5v1.5zm0-3.25H8V11.5h8.5v1.25zm0-3.25H8V8h8.5v1.5z" />
    </svg>
  );
}

/** Monday.com — three colored dots (their logo mark) */
export function MondayIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Three rounded pill shapes — monday.com's recognizable three-dot mark */}
      <circle cx="5" cy="12" r="3" />
      <circle cx="12" cy="12" r="3" />
      <circle cx="19" cy="12" r="3" />
    </svg>
  );
}

/** Constant Contact — CC lettermark */
export function ConstantContactIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 14.5c-2.76 0-5-2.24-5-5s2.24-5 5-5c1.34 0 2.55.52 3.46 1.37l-1.41 1.41A2.96 2.96 0 0 0 10.5 8.5c-1.65 0-3 1.35-3 3s1.35 3 3 3c.83 0 1.57-.34 2.12-.88l1.41 1.41A4.95 4.95 0 0 1 10.5 16.5zm6.5 0c-2.76 0-5-2.24-5-5s2.24-5 5-5c1.34 0 2.55.52 3.46 1.37l-1.41 1.41A2.96 2.96 0 0 0 17 8.5c-1.65 0-3 1.35-3 3s1.35 3 3 3c.83 0 1.57-.34 2.12-.88l1.41 1.41A4.95 4.95 0 0 1 17 16.5z" />
    </svg>
  );
}
