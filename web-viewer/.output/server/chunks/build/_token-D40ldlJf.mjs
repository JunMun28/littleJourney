import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { N } from '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:async_hooks';
import 'vinxi/lib/invariant';
import 'vinxi/lib/path';
import 'node:url';
import '@tanstack/react-router';
import 'tiny-invariant';
import 'jsesc';
import 'node:stream';
import 'isbot';
import 'react-dom/server';
import '@tanstack/react-cross-context';

function g(e) {
  if (!e || e.length === 0) return null;
  try {
    const n = atob(e), r = JSON.parse(n);
    return typeof r.familyMemberId != "string" || typeof r.permissionLevel != "string" || typeof r.childId != "string" || typeof r.createdAt != "number" || typeof r.expiresAt != "number" || typeof r.version != "number" || r.permissionLevel !== "view_only" && r.permissionLevel !== "view_interact" ? null : { familyMemberId: r.familyMemberId, permissionLevel: r.permissionLevel, childId: r.childId, createdAt: r.createdAt, expiresAt: r.expiresAt, version: r.version };
  } catch {
    return null;
  }
}
function f(e) {
  return Date.now() > e.expiresAt;
}
const y = { id: "child-1", name: "Baby Emma", nickname: "Em", dateOfBirth: "2025-01-15" }, b = [{ id: "entry-1", type: "photo", mediaUris: ["https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800"], caption: "First smile captured! Such a precious moment.", date: "2025-02-15", tags: ["milestone", "smile"], createdAt: "2025-02-15T10:30:00Z", updatedAt: "2025-02-15T10:30:00Z", createdByName: "Mum" }, { id: "entry-2", type: "photo", mediaUris: ["https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800", "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800"], caption: "\u6EE1\u6708 celebration with grandparents!", date: "2025-02-14", tags: ["\u6EE1\u6708", "family"], createdAt: "2025-02-14T14:00:00Z", updatedAt: "2025-02-14T14:00:00Z", createdByName: "Dad" }, { id: "entry-3", type: "text", caption: "Emma slept through the night for the first time! We are so happy and relieved. She's growing so fast.", date: "2025-02-10", createdAt: "2025-02-10T08:00:00Z", updatedAt: "2025-02-10T08:00:00Z", createdByName: "Mum" }, { id: "entry-4", type: "video", mediaUris: ["https://example.com/video.mp4"], thumbnailUrl: "https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=800", caption: "Tummy time practice - getting stronger every day!", date: "2025-02-08", tags: ["development"], createdAt: "2025-02-08T16:30:00Z", updatedAt: "2025-02-08T16:30:00Z", createdByName: "Dad" }];
async function x(e, n) {
  return await c(300), y;
}
async function v(e, n) {
  return await c(500), b;
}
function c(e) {
  return new Promise((n) => setTimeout(n, e));
}
function w() {
  return jsxs("div", { style: t.container, children: [jsx("div", { style: t.loadingSpinner }), jsx("p", { style: t.loadingText, children: "Loading memories..." })] });
}
function I({ message: e }) {
  return jsxs("div", { style: t.container, children: [jsx("div", { style: t.errorIcon, children: "!" }), jsx("h1", { style: t.errorTitle, children: "Oops!" }), jsx("p", { style: t.errorMessage, children: e }), jsx("p", { style: t.errorHint, children: "Please check the link you received or ask the parent to resend it." })] });
}
function S() {
  return jsxs("div", { style: t.container, children: [jsx("div", { style: t.expiredIcon, children: "\u23F0" }), jsx("h1", { style: t.expiredTitle, children: "Link Expired" }), jsxs("p", { style: t.expiredMessage, children: ["This link has expired due to inactivity.", jsx("br", {}), "Please ask the parent to resend the magic link."] })] });
}
function k({ child: e, entries: n }) {
  const r = e.nickname || e.name;
  return jsxs("div", { style: t.feedContainer, children: [jsxs("header", { style: t.header, children: [jsxs("h1", { style: t.headerTitle, children: [r, "'s Journey"] }), jsx("p", { style: t.headerSubtitle, children: "Little Journey" })] }), jsx("main", { style: t.feed, children: n.length === 0 ? jsx("div", { style: t.emptyState, children: jsx("p", { children: "No memories yet. Check back soon!" }) }) : n.map((d) => jsx(C, { entry: d }, d.id)) })] });
}
function C({ entry: e }) {
  const [n, r] = useState(0), d = e.mediaUris && e.mediaUris.length > 1, s = new Date(e.date).toLocaleDateString("en-SG", { year: "numeric", month: "short", day: "numeric" });
  return jsxs("article", { style: t.card, children: [e.type === "photo" && e.mediaUris && e.mediaUris.length > 0 && jsxs("div", { style: t.mediaContainer, children: [jsx("img", { src: e.mediaUris[n], alt: e.caption || "Photo", style: t.media }), d && jsxs("div", { style: t.carouselControls, children: [jsx("button", { onClick: () => r((o) => o > 0 ? o - 1 : e.mediaUris.length - 1), style: t.carouselButton, "aria-label": "Previous photo", children: "\u2039" }), jsxs("span", { style: t.carouselIndicator, children: [n + 1, " / ", e.mediaUris.length] }), jsx("button", { onClick: () => r((o) => o < e.mediaUris.length - 1 ? o + 1 : 0), style: t.carouselButton, "aria-label": "Next photo", children: "\u203A" })] })] }), e.type === "video" && jsx("div", { style: t.mediaContainer, children: e.thumbnailUrl ? jsxs("div", { style: t.videoThumbnail, children: [jsx("img", { src: e.thumbnailUrl, alt: "Video thumbnail", style: t.media }), jsx("div", { style: t.playIcon, children: "\u25B6" })] }) : jsx("div", { style: t.videoPlaceholder, children: "\u{1F3AC} Video" }) }), jsxs("div", { style: t.cardContent, children: [e.caption && jsx("p", { style: t.caption, children: e.caption }), e.tags && e.tags.length > 0 && jsx("div", { style: t.tags, children: e.tags.map((o) => jsxs("span", { style: t.tag, children: ["#", o] }, o)) }), jsxs("div", { style: t.meta, children: [jsx("span", { style: t.date, children: s }), e.createdByName && jsxs("span", { style: t.author, children: ["Posted by ", e.createdByName] })] })] })] });
}
const t = { container: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f5f7fa", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: "2rem", textAlign: "center" }, feedContainer: { minHeight: "100vh", background: "#f5f7fa", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }, loadingSpinner: { width: "48px", height: "48px", border: "4px solid #e9ecef", borderTopColor: "#0a7ea4", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "1rem" }, loadingText: { color: "#6c757d", fontSize: "1rem" }, errorIcon: { width: "64px", height: "64px", background: "#dc3545", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }, errorTitle: { fontSize: "1.5rem", color: "#1a1a2e", margin: "0 0 0.5rem 0" }, errorMessage: { color: "#495057", margin: "0 0 1rem 0" }, errorHint: { color: "#6c757d", fontSize: "0.875rem" }, expiredIcon: { fontSize: "4rem", marginBottom: "1rem" }, expiredTitle: { fontSize: "1.5rem", color: "#1a1a2e", margin: "0 0 1rem 0" }, expiredMessage: { color: "#495057", lineHeight: 1.6 }, header: { background: "#0a7ea4", color: "white", padding: "1.5rem 1rem", textAlign: "center", position: "sticky", top: 0, zIndex: 100 }, headerTitle: { margin: 0, fontSize: "1.5rem", fontWeight: 600 }, headerSubtitle: { margin: "0.25rem 0 0 0", fontSize: "0.875rem", opacity: 0.8 }, feed: { maxWidth: "600px", margin: "0 auto", padding: "1rem" }, emptyState: { padding: "3rem 1rem", textAlign: "center", color: "#6c757d" }, card: { background: "white", borderRadius: "12px", overflow: "hidden", marginBottom: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }, mediaContainer: { position: "relative", width: "100%", aspectRatio: "1", background: "#f0f0f0" }, media: { width: "100%", height: "100%", objectFit: "cover" }, carouselControls: { position: "absolute", bottom: "1rem", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(0,0,0,0.6)", borderRadius: "20px", padding: "0.25rem 0.75rem" }, carouselButton: { background: "none", border: "none", color: "white", fontSize: "1.5rem", cursor: "pointer", padding: "0 0.25rem" }, carouselIndicator: { color: "white", fontSize: "0.875rem" }, videoThumbnail: { position: "relative", width: "100%", height: "100%" }, playIcon: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "60px", height: "60px", background: "rgba(0,0,0,0.6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.5rem" }, videoPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#e9ecef", fontSize: "1.5rem" }, cardContent: { padding: "1rem" }, caption: { margin: "0 0 0.75rem 0", fontSize: "1rem", lineHeight: 1.5, color: "#1a1a2e" }, tags: { display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }, tag: { background: "#e9ecef", color: "#495057", padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem" }, meta: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.875rem", color: "#6c757d" }, date: {}, author: {} }, F = function() {
  const { token: n } = N.useParams(), [r, d] = useState({ status: "loading" });
  return useEffect(() => {
    async function s() {
      const o = g(n);
      if (!o) {
        d({ status: "error", message: "Invalid link" });
        return;
      }
      if (f(o)) {
        d({ status: "expired" });
        return;
      }
      try {
        const [m, p] = await Promise.all([x(n, o.childId), v(n, o.childId)]);
        d({ status: "ready", payload: o, child: m, entries: p });
      } catch {
        d({ status: "error", message: "Failed to load data" });
      }
    }
    s();
  }, [n]), r.status === "loading" ? jsx(w, {}) : r.status === "error" ? jsx(I, { message: r.message }) : r.status === "expired" ? jsx(S, {}) : jsx(k, { child: r.child, entries: r.entries });
};

export { F as component };
//# sourceMappingURL=_token-D40ldlJf.mjs.map
