import type { Metadata } from "next";

export const metadata: Metadata = { title: "Accessibility", description: "Accessibility commitment for the Northeast Florida Support Navigator." };

export default function AccessibilityPage() {
  return <main id="main-content"><article className="shell policy-page">
    <p className="eyebrow">Accessibility</p><h1>Support should be easier to reach.</h1>
    <p>We aim to provide a site that works with keyboards, screen readers, zoom, high-contrast settings, and reduced-motion preferences.</p>
    <h2>Accessibility features</h2>
    <ul><li>A skip link and consistent heading structure</li><li>Keyboard-operable navigation, filters, forms, and expandable answers</li><li>Visible labels, status messages, and error messages</li><li>Responsive layouts that support mobile devices and text enlargement</li><li>Reduced motion when requested by the device</li></ul>
    <h2>If something is difficult to use</h2>
    <p>Please use the resource-report form and select “Other” to describe the page, feature, assistive technology, and problem you encountered. Do not include private health information. For immediate human navigation, dial 211 or call UF Health Jacksonville CARD at 904-633-0760.</p>
  </article></main>;
}
